const BusinessInfo = require('../models/BusinessInfo.model');

const UPDATABLE_FIELDS = ['name', 'description', 'address', 'phone', 'socialLinks', 'hours'];

const getBusinessInfo = async () => {
  const info = await BusinessInfo.findOne({ order: [['id', 'ASC']] });
  if (info) return info;

  return BusinessInfo.create({ name: 'Mi comercio', socialLinks: {} });
};

const updateBusinessInfo = async (data) => {
  const info = await getBusinessInfo();

  UPDATABLE_FIELDS.forEach((field) => {
    if (data[field] !== undefined) info[field] = data[field];
  });

  await info.save();
  return info;
};

module.exports = { getBusinessInfo, updateBusinessInfo };
