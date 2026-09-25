const BusinessInfoService = require('../services/businessInfo.service');

const getBusinessInfo = async (req, res) => {
  try {
    const info = await BusinessInfoService.getBusinessInfo();
    return res.status(200).json({ status: 200, data: info });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const updateBusinessInfo = async (req, res) => {
  try {
    const info = await BusinessInfoService.updateBusinessInfo(req.body);
    return res.status(200).json({ status: 200, data: info, message: 'Información del comercio actualizada' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

module.exports = { getBusinessInfo, updateBusinessInfo };
