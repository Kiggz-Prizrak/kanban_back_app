const REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9_]{3,30}$/,
  title: /^(?=.*\S).{1,100}$/,
  description: /^(?=.*\S)[\s\S]{1,1000}$/,
  password:
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[_.@$!%*#?&])[A-Za-z\d_.@$!%*#?&]{8,}$/,
};

module.exports = REGEX;
