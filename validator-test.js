import validator from 'validator';
import joi from 'joi';
import util from 'util';

let errors = {};
const params = ['first_name', 'last_name', 'job_title'];
const data = { first_name: '111', last_name: '1112', job_title: '  ' };

for (const param in data) {
  console.log(param);
  if (validator.isEmpty(data[param] + '')) console.log('empty');
}

params.forEach((d) => {
  if (validator.isEmpty(data[d] + '')) console.log(d + ' empty1');
});

const validate = {
  first_name: joi.string().trim().max(3).required().empty(),
  last_name: joi.string().trim().max(3).required().empty(),
  job_title: joi.string().trim().max(3).required().empty(),
};
const schema = joi.object(validate);

const { error } = schema.validate(data, { abortEarly: false });
console.log(JSON.stringify(error, null, 100));

console.log(
  util.inspect(error, { showHidden: false, depth: null, colors: true })
);
