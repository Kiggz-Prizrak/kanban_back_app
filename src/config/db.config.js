// module.exports = {
//     HOST: process.env.DB_HOST,
//     USER: process.env.DB_USER,
//     PASSWORD: process.env.DB_PASSWORD,
//     DB: process.env.DB_NAME,
//     port: process.env.DB_PORT,
//     dialect: "mysql",
//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000
//     }
// };

require("dotenv").config();

const dialect = process.env.DB_DIALECT || "sqlite";

const config = {
  dialect,
};

if (dialect === "mysql") {
  Object.assign(config, {
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    DB: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    pool: {
      max: 10000,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

if (dialect === "sqlite") {
  config.storage = process.env.DB_STORAGE || "./database.sqlite";
}

module.exports = config;
