exports.toInt = (value) => {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
};

exports.toIntOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
};

exports.toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};
