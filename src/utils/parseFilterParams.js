const parseContactType = (contactType) => {
  if (typeof contactType !== 'string') return undefined;

  const value = contactType.toLowerCase();
  const validTypes = ['work', 'home', 'personal'];

  return validTypes.includes(value) ? value : undefined;
};

const parseIsFavourite = (isFavourite) => {
  if (typeof isFavourite === 'boolean') return isFavourite;
  if (typeof isFavourite === 'string') {
    const value = isFavourite.toLowerCase();
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return undefined;
};

export const parseFilterParams = (query) => {
  const { contactType, isFavourite } = query;
  const parsedContactType = parseContactType(contactType);
  const parsedIsFavourite = parseIsFavourite(isFavourite);

  return {
    contactType: parsedContactType,
    isFavourite: parsedIsFavourite,
  };
};
