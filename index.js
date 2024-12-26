import express from "express";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import validator from "joi";
import moment from "moment-timezone";
import { rateLimit } from "express-rate-limit";

import dbmp from "./postgresql/connection.js";
import { validate, getErrors } from "./utils.js";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Use an external store for consistency across multiple server instances.
  handlle: (req, res, next) => {
    res.status(429).json({
      errors: [{ error: "rateLimit", message: "Too many requests, please try again later." }],
    });
  },
});

const timezone = "America/Toronto";

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(limiter);

app.get("/", (req, res) => {
  // Returns API documentation
  res.sendFile(path.join(process.cwd(), "api-documentation.html"));
});

app.get("/employees", async (req, res) => {
  try {
    const data = await dbmp.query("SELECT * FROM employee ORDER BY updated_at DESC LIMIT 500");
    res.json(data.rows);
  } catch (error) {
    console.error("Error fetching employees:", error.stack);
    res.status(500).json({
      errors: [{ error: "database", message: "Failed to fetch employees." }],
    });
  }
});

app.get("/employees/:employee_id", async (req, res, next) => {
  const maxDataLength = 1000000000;
  const params = {
    employee_id: validator.number().integer().max(maxDataLength).required().empty().positive(),
  };

  const schema = validator.object(params);
  const { value, error } = schema.validate(req.params, { abortEarly: false });

  if (error !== undefined) {
    let errors = [];
    for (let i = 0; i < error.details.length; i++) {
      errors[i] = {
        param: error.details[i].context.key,
        message: error.details[i].message,
      };
    }

    if (errors) console.log(errors);

    res.json({ errors: errors });
    return next();
  }

  const query = {
    text: "SELECT * FROM employee WHERE employee_id = $1",
    values: [value.employee_id],
  };
  try {
    const result = await dbmp.query(query);
    if (result.rows[0] === undefined) {
      res.json({
        errors: [
          {
            param: value.employee_id,
            message: "No record found!",
          },
        ],
      });
      return next();
    }
    res.status(201);
    res.json(result.rows[0]);
    return next();
  } catch (err) {
    console.log(err.stack);
    res.json({
      errors: [{ error: "database", message: "Failed to fetch employee by id." }],
    });
    return next();
  }
});

app.post("/employees", async (req, res, next) => {
  const { value, error } = validate({
    first_name: req.body.first_name || "",
    last_name: req.body.last_name || "",
    job_title: req.body.job_title || "",
  });

  if (error !== undefined) {
    const errors = getErrors(error);
    res.json({ errors: errors });
    return next();
  }

  const timenow = moment.tz(timezone).format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
  const query = {
    text: "INSERT INTO employee (first_name, last_name, job_title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    values: [value.first_name, value.last_name, value.job_title, timenow, timenow],
  };
  try {
    const result = await dbmp.query(query);
    res.status(201);
    res.json(result.rows[0]);
    return next();
  } catch (err) {
    console.log(err.stack);
    res.json({ errors: [{ error: "database", message: "Database error!" }] });
    return next();
  }
});

app.patch("/employees/:employee_id", async (req, res, next) => {
  const { value, error } = validate({
    first_name: req.body.first_name || "",
    last_name: req.body.last_name || "",
    job_title: req.body.job_title || "",
    employee_id: req.params.employee_id || "",
  });

  if (error !== undefined) {
    const errors = getErrors(error);
    res.json({ errors: errors });
    return next();
  }

  const timenow = moment.tz(timezone).format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
  const query = {
    text: `UPDATE employee 
           SET first_name = $1, last_name = $2, job_title = $3, updated_at = $5 
           WHERE employee_id = $4 
           RETURNING *`,
    values: [value.first_name, value.last_name, value.job_title, value.employee_id, timenow],
  };

  try {
    const result = await dbmp.query(query);
    res.status(201).json(result.rows[0]);
    return next();
  } catch (err) {
    console.log(err.stack);
    res.json({ errors: [{ error: "database", message: "Database error!" }] });
    return next();
  }
});

app.delete("/employees/:employee_id", async (req, res, next) => {
  const { value, error } = validate({
    employee_id: req.params.employee_id || "",
  });

  if (error !== undefined) {
    const errors = getErrors(error);
    res.json({ errors: errors });
    return next();
  }

  const query = {
    text: `DELETE FROM employee 
           WHERE employee_id = $1
           RETURNING *`,
    values: [value.employee_id],
  };

  try {
    const result = await dbmp.query(query);
    res.status(204).send();
    return next();
  } catch (err) {
    console.log(err.stack);
    res.json({ errors: [{ error: "database", message: "Database error!" }] });
    return next();
  }
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
