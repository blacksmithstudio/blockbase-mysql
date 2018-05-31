const Joi = require('joi')

module.exports = Joi.object().keys({
    firstname: Joi.string(),
    lastname:  Joi.string()
})