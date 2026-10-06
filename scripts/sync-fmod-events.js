const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const prettier = require('prettier');

const ROOT = path.resolve(__dirname, '..');
const FMOD_DIR = path.join(ROOT, 'src/renderer/FMOD');
const BANKS_DIR = path.join(ROOT, 'src/renderer/assets/sounds/banks');
const CONSTANTS_PATH = path.join(FMOD_DIR, 'constants.ts');
const EVENTS_CONSTANT_NAME = 'FMOD_EVENTS';
const EVENT_PREFIX = 'event:/';
const DEFAULT_EVENT_VOLUME = 1;

const PARAMETER_FLAGS = {
  READ_ONLY: 0x01,
  AUTOMATIC: 0x02,
  GLOBAL: 0x04,
  DISCRETE: 0x08,
  LABELED: 0x10,
};

function loadFmod() {
  const factory = require(path.join(FMOD_DIR, 'fmodstudio.js'));

  return new Promise((resolve, reject) => {
    const fmod = {
      wasmBinary: fs.readFileSync(path.join(FMOD_DIR, 'fmodstudio.wasm')),
      INITIAL_MEMORY: 64 * 1024 * 1024,
    };
    fmod.onRuntimeInitialized = () => resolve(fmod);

    try {
      factory(fmod);
    } catch (error) {
      reject(error);
    }
  });
}

function check(fmod, result, action) {
  if (result !== fmod.OK) {
    throw new Error(`FMOD failed to ${action}: ${fmod.ErrorString(result)}`);
  }
}

function createStudioSystem(fmod) {
  const systemOut = {};
  check(fmod, fmod.Studio_System_Create(systemOut), 'create the studio system');

  const coreOut = {};
  check(fmod, systemOut.val.getCoreSystem(coreOut), 'get the core system');
  check(fmod, coreOut.val.setOutput(fmod.OUTPUTTYPE_NOSOUND), 'disable audio output');
  check(
    fmod,
    systemOut.val.initialize(64, fmod.STUDIO_INIT_NORMAL, fmod.INIT_NORMAL, null),
    'initialize the studio system'
  );

  return systemOut.val;
}

function getBankFileNames() {
  return fs
    .readdirSync(BANKS_DIR)
    .filter((name) => name.endsWith('.bank'))
    .sort((a, b) => Number(b.endsWith('.strings.bank')) - Number(a.endsWith('.strings.bank')));
}

function toParameterDefinition(description) {
  const { minimum, maximum, flags } = description;
  const definition = { min: roundValue(minimum), max: roundValue(maximum) };

  if (flags & (PARAMETER_FLAGS.DISCRETE | PARAMETER_FLAGS.LABELED)) definition.discrete = true;
  if (flags & PARAMETER_FLAGS.AUTOMATIC) definition.automatic = true;
  if (flags & PARAMETER_FLAGS.READ_ONLY) definition.readOnly = true;
  if (flags & PARAMETER_FLAGS.GLOBAL) definition.global = true;

  return definition;
}

function roundValue(value) {
  return Math.round(value * 1e6) / 1e6;
}

function readEventDescription(fmod, eventDescription) {
  const pathOut = {};
  check(fmod, eventDescription.getPath(pathOut, 512, null), 'read an event path');

  const countOut = {};
  check(fmod, eventDescription.getParameterDescriptionCount(countOut), 'count parameters');

  const parameters = {};
  for (let index = 0; index < countOut.val; index++) {
    const description = fmod.STUDIO_PARAMETER_DESCRIPTION();
    check(
      fmod,
      eventDescription.getParameterDescriptionByIndex(index, description),
      'read a parameter'
    );
    parameters[description.name] = toParameterDefinition(description);
  }

  return { path: pathOut.val, parameters };
}

function readBankEvents(fmod, system) {
  const events = new Map();

  for (const bankName of getBankFileNames()) {
    fmod.FS_createDataFile(
      '/',
      bankName,
      fs.readFileSync(path.join(BANKS_DIR, bankName)),
      true,
      false
    );

    const bankOut = {};
    check(
      fmod,
      system.loadBankFile(`/${bankName}`, fmod.STUDIO_LOAD_BANK_NORMAL, bankOut),
      `load ${bankName}`
    );

    const countOut = {};
    check(fmod, bankOut.val.getEventCount(countOut), `count events in ${bankName}`);
    if (countOut.val === 0) continue;

    const listOut = {};
    check(fmod, bankOut.val.getEventList(listOut, countOut.val, {}), `list events in ${bankName}`);

    for (const eventDescription of listOut.val) {
      const event = readEventDescription(fmod, eventDescription);
      if (event.path.startsWith(EVENT_PREFIX)) events.set(event.path, event);
    }
  }

  return events;
}

function unwrapExpression(node) {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function findEventsObject(sourceFile) {
  let eventsObject = null;

  sourceFile.forEachChild((statement) => {
    if (!ts.isVariableStatement(statement)) return;

    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(sourceFile) !== EVENTS_CONSTANT_NAME) continue;

      const initializer = declaration.initializer && unwrapExpression(declaration.initializer);
      if (initializer && ts.isObjectLiteralExpression(initializer)) eventsObject = initializer;
    }
  });

  if (!eventsObject) {
    throw new Error(`Could not find the ${EVENTS_CONSTANT_NAME} object in ${CONSTANTS_PATH}`);
  }

  return eventsObject;
}

function getPropertyName(property, sourceFile) {
  return ts.isStringLiteral(property.name) ? property.name.text : property.name.getText(sourceFile);
}

function findObjectProperty(objectLiteral, name, sourceFile) {
  if (!ts.isObjectLiteralExpression(objectLiteral)) return undefined;

  return objectLiteral.properties.find(
    (entry) => ts.isPropertyAssignment(entry) && getPropertyName(entry, sourceFile) === name
  );
}

function readExistingEntries(sourceFile, eventsObject) {
  return eventsObject.properties.filter(ts.isPropertyAssignment).map((property) => {
    const value = unwrapExpression(property.initializer);
    const pathProperty = findObjectProperty(value, 'path', sourceFile);
    const volumeProperty = findObjectProperty(value, 'volume', sourceFile);
    const pathValue =
      pathProperty && ts.isStringLiteralLike(pathProperty.initializer)
        ? pathProperty.initializer.text
        : null;

    return {
      key: getPropertyName(property, sourceFile),
      path: pathValue,
      volumeText: volumeProperty ? volumeProperty.initializer.getText(sourceFile) : null,
      text: property.getText(sourceFile),
    };
  });
}

function toConstantName(segments) {
  const words = segments
    .join(' ')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase());
  const name = words.filter((word, index) => word !== words[index - 1]).join('_');

  return /^\d/.test(name) ? `_${name}` : name;
}

function createEventKey(eventPath, takenKeys) {
  const segments = eventPath.slice(EVENT_PREFIX.length).split('/');

  for (let count = Math.min(2, segments.length); count <= segments.length; count++) {
    const key = toConstantName(segments.slice(-count));
    if (key && !takenKeys.has(key)) return key;
  }

  const baseKey = toConstantName(segments) || 'EVENT';
  let suffix = 2;
  while (takenKeys.has(`${baseKey}_${suffix}`)) suffix++;
  return `${baseKey}_${suffix}`;
}

function toPropertyKey(name) {
  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
}

function serializeObject(object) {
  const entries = Object.entries(object).map(
    ([key, value]) =>
      `${toPropertyKey(key)}: ${typeof value === 'object' ? serializeObject(value) : JSON.stringify(value)}`
  );
  return `{ ${entries.join(', ')} }`;
}

function serializeEvent(key, event, volumeText = String(DEFAULT_EVENT_VOLUME)) {
  return `${toPropertyKey(key)}: { path: ${JSON.stringify(event.path)}, volume: ${volumeText}, parameters: ${serializeObject(event.parameters)} }`;
}

function mergeEntries(existingEntries, bankEvents) {
  const takenKeys = new Set(existingEntries.map((entry) => entry.key));
  const knownPaths = new Set();
  const report = { updated: [], added: [], missing: [] };

  const lines = existingEntries.map((entry) => {
    const event = entry.path && bankEvents.get(entry.path);
    if (!event) {
      report.missing.push(`${entry.key} (${entry.path ?? 'no path'})`);
      return entry.text;
    }

    knownPaths.add(entry.path);
    report.updated.push(entry.key);
    return serializeEvent(entry.key, event, entry.volumeText ?? undefined);
  });

  const newEvents = [...bankEvents.values()]
    .filter((event) => !knownPaths.has(event.path))
    .sort((a, b) => a.path.localeCompare(b.path));

  for (const event of newEvents) {
    const key = createEventKey(event.path, takenKeys);
    takenKeys.add(key);
    report.added.push(`${key} (${event.path})`);
    lines.push(serializeEvent(key, event));
  }

  return { objectText: `{\n${lines.map((line) => `${line},`).join('\n')}\n}`, report };
}

async function writeConstants(sourceText, eventsObject, objectText) {
  const updatedText =
    sourceText.slice(0, eventsObject.getStart()) +
    objectText +
    sourceText.slice(eventsObject.getEnd());
  const prettierConfig = (await prettier.resolveConfig(CONSTANTS_PATH)) ?? {};
  const formatted = await prettier.format(updatedText, {
    ...prettierConfig,
    filepath: CONSTANTS_PATH,
  });

  if (formatted === sourceText) return false;

  fs.writeFileSync(CONSTANTS_PATH, formatted);
  return true;
}

function printReport(report, changed) {
  console.log(`Updated ${report.updated.length} existing event(s).`);

  if (report.added.length > 0) {
    console.log(`Added ${report.added.length} new event(s):`);
    report.added.forEach((entry) => console.log(`  + ${entry}`));
  }

  if (report.missing.length > 0) {
    console.warn(
      `\x1b[33m${report.missing.length} event(s) not found in the banks (left unchanged):\x1b[0m`
    );
    report.missing.forEach((entry) => console.warn(`  ? ${entry}`));
  }

  console.log(
    changed
      ? `\x1b[32m✓ Wrote ${path.relative(ROOT, CONSTANTS_PATH)}\x1b[0m`
      : '✓ Already up to date'
  );
}

async function main() {
  const fmod = await loadFmod();
  const system = createStudioSystem(fmod);
  const bankEvents = readBankEvents(fmod, system);
  system.release();

  const sourceText = fs.readFileSync(CONSTANTS_PATH, 'utf8');
  const sourceFile = ts.createSourceFile(CONSTANTS_PATH, sourceText, ts.ScriptTarget.Latest, true);
  const eventsObject = findEventsObject(sourceFile);
  const existingEntries = readExistingEntries(sourceFile, eventsObject);

  const { objectText, report } = mergeEntries(existingEntries, bankEvents);
  const changed = await writeConstants(sourceText, eventsObject, objectText);

  printReport(report, changed);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\x1b[31m✗ ${error.message}\x1b[0m`);
    process.exit(1);
  });
