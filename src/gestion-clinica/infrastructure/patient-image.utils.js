const GENERIC_IMAGE_HOSTS = [
  'placedog.net',
  'placecats.com',
  'placekitten.com',
  'pravatar.cc',
  'picsum.photos',
  'loremflickr.com'
];

const CAT_AVATAR_NAMES = [
  'neo',
  'millie',
  'bella',
  'poppy',
  'louie'
];

const SPECIES_COLORS = {
  bird: '#0284C7',
  rabbit: '#7C3AED',
  other: '#64748B'
};

export function normalizeSpeciesLabel(species) {
  if (species == null) return '';
  const raw = typeof species === 'object'
    ? (species.name ?? species.Name ?? '')
    : String(species);
  return raw.split(' - ')[0].split('–')[0].trim();
}

export function getSpeciesKind(species) {
  const label = normalizeSpeciesLabel(species).toLowerCase();

  if (label.startsWith('perro') || label.includes('dog')) return 'dog';
  if (label.startsWith('gato') || label.includes('cat')) return 'cat';
  if (label.startsWith('ave') || label.includes('bird') || label.includes('pájaro') || label.includes('pajaro')) {
    return 'bird';
  }
  if (label.startsWith('conejo') || label.includes('rabbit')) return 'rabbit';
  return 'other';
}

function toSeed(id, name) {
  const numericId = Number(id);
  if (Number.isFinite(numericId) && numericId > 0) return numericId;

  const normalizedName = String(name ?? '').trim();
  if (!normalizedName) return 1;

  return normalizedName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function isGenericPatientImage(image) {
  if (!image) return true;
  return GENERIC_IMAGE_HOSTS.some((host) => String(image).includes(host));
}

function buildCatFallback(seed) {
  const name = CAT_AVATAR_NAMES[seed % CAT_AVATAR_NAMES.length];
  return `https://placecats.com/${name}/150/150`;
}

function buildSpeciesFallback(kind, seed) {
  switch (kind) {
    case 'cat':
      return buildCatFallback(seed);
    case 'dog':
      return `https://placedog.net/150/150?id=${(seed % 69) + 1}`;
    case 'bird':
    case 'rabbit':
    case 'other':
      return buildInitialsPlaceholder(seed, SPECIES_COLORS[kind] ?? SPECIES_COLORS.other);
    default:
      return buildInitialsPlaceholder(seed, SPECIES_COLORS.other);
  }
}

function buildInitialsPlaceholder(seed, color, symbol = null) {
  const icons = symbol ? [symbol] : ['🐾', '🐦', '🐇', '★'];
  const icon = icons[seed % icons.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" rx="18" fill="${color}"/><text x="75" y="84" text-anchor="middle" font-size="52">${icon}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function resolvePatientImage({ id = null, image = null, species = '', name = '' } = {}) {
  const kind = getSpeciesKind(species);
  const seed = toSeed(id, name);

  if (image && !isGenericPatientImage(image)) {
    return image;
  }

  return buildSpeciesFallback(kind, seed);
}

export function resolvePatientImageFromPatient(patient) {
  if (!patient) return resolvePatientImage({});
  return resolvePatientImage({
    id: patient.id,
    image: patient.image,
    species: patient.species,
    name: patient.name
  });
}

const ERROR_FALLBACK_COLORS = {
  cat: '#7C3AED',
  dog: '#0284C7',
  bird: '#0369A1',
  rabbit: '#9333EA',
  other: '#64748B'
};

const ERROR_FALLBACK_SYMBOLS = {
  cat: '🐱',
  dog: '🐶',
  bird: '🐦',
  rabbit: '🐇',
  other: '🐾'
};

export function resolvePatientImageOnError(patient) {
  if (!patient) return buildInitialsPlaceholder(1, ERROR_FALLBACK_COLORS.other, ERROR_FALLBACK_SYMBOLS.other);
  const kind = getSpeciesKind(patient.species);
  const seed = toSeed(patient.id, patient.name);
  return buildInitialsPlaceholder(
    seed,
    ERROR_FALLBACK_COLORS[kind] ?? ERROR_FALLBACK_COLORS.other,
    ERROR_FALLBACK_SYMBOLS[kind] ?? ERROR_FALLBACK_SYMBOLS.other
  );
}
