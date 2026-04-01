# LFT Backend

ackend API using MySQL, Sequelize, and Express for managing devices, hardware, groups, and bridges.

### Overview

This project provides a RESTful API to perform CRUD operations on entities such as devices, hardware components, groups, and bridges. The data is stored in a MySQL database, and Sequelize is used as the ORM (Object-Relational Mapping) for simplified database interactions. Express.js handles the routing and server setup.

## summary

- [Installation](#installation)
- [Database configuration](#configuration)
- [Utilisation](#utilisation)
- [Test](#test)

## Installation

1. Clone repository :

```bash
git clone https://github.com/votre-utilisateur/nom-du-projet.git
```

2. Install dependencies

```bash
cd dem-analysis-back
npm install
```

## Database configuration

1. Access MySQL/MariaDB


Open a terminal and access MySQL or MariaDB using the root user (or another privileged user):
```bash
git clone https://github.com/votre-utilisateur/nom-du-projet.git
```
It will prompt you to enter the root password. Type the password and hit Enter.

2. Create Database

If the database test doesn't already exist, you'll need to create it:
```bash
CREATE DATABASE dem_database;
```

3. Create Admin User

Create a new user named "dem-database" with the password "password":
```bash
CREATE USER 'dem_admin'@'localhost' IDENTIFIED BY 'password';
```

4. Grant Permissions to New User

Now, grant all permissions on the dem_database database to the "dem-admin". This allows the user to perform all actions on this specific database:
Create a new user named "dem-database" with the password "password":
```bash
GRANT ALL PRIVILEGES ON dem_database.* TO 'dem_admin'@'localhost';
```
Then, flush privileges to make sure the changes take effect:
```bash
FLUSH PRIVILEGES;
```

## Utilisation

start API : 

```bash	
npm start
```

The API is accessible with the following address :  http://localhost:3000.

## Test 

you can test the API by importing the "dem_insomnia_routes" file into the [insomnia application](https://insomnia.rest/)

