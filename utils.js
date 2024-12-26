import Joi from 'joi';

const maxDataLength = 100;

const validate = (data) => {
  let params = {};

  if (data.first_name !== undefined) {
    params = {
      ...params,
      first_name: Joi.string().trim().max(maxDataLength).required().empty(),
    };
  }

  if (data.last_name !== undefined) {
    params = {
      ...params,
      last_name: Joi.string().trim().max(maxDataLength).required().empty(),
    };
  }

  if (data.job_title !== undefined) {
    params = {
      ...params,
      job_title: Joi.string().trim().max(maxDataLength).required().empty(),
    };
  }

  if (data.employee_id !== undefined) {
    params = {
      ...params,
      employee_id: Joi.number()
        .integer()
        .max(1000000000)
        .required()
        .empty()
        .positive(),
    };
  }

  const schema = Joi.object(params);
  return schema.validate(data, { abortEarly: false });
};

const getErrors = (error) => {
  let errors = [];
  for (let i = 0; i < error.details.length; i++) {
    errors[i] = {
      param: error.details[i].context.key,
      message: error.details[i].message,
    };
  }
  return errors;
};

export { validate, getErrors };
