const BusinessInfoService = require('../services/businessInfo.service');
const { asyncHandler } = require('../utils/http');

const getBusinessInfo = asyncHandler(async () => ({ data: await BusinessInfoService.getBusinessInfo() }));

const updateBusinessInfo = asyncHandler(async (req) => ({
  data: await BusinessInfoService.updateBusinessInfo(req.body),
  message: 'Información del comercio actualizada',
}));

module.exports = { getBusinessInfo, updateBusinessInfo };
