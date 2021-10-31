const jwt = require('jsonwebtoken');
const config = require('config');

const checkForAccess = (groups, access) => {
  if (groups) {
    console.log('Access: ');
    console.log(access);

    var readFound = false;
    var writeFound = false;

    if (!access.read && !access.write) {
      console.log('Access for all');
      return true;
    }
    for (var i = 0; i < groups.length; i++) {
      var group = groups[i];
      console.log(group.access);

      var groupAccess = group.access.find((a) => a.type === access.type);
      console.log('Group access: ');
      console.log(groupAccess);
      if (access.read && groupAccess && groupAccess.read) {
        console.log('Read access aquired');
        readFound = true;
      }

      if (access.write && groupAccess && groupAccess.write) {
        console.log('Write access aquired');
        writeFound = true;
      }

      if ((!access.read || readFound) && (!access.write || writeFound)) {
        console.log('Access aquired');
        return true;
      }
    }
  }
  console.log('Access denied');
  return false;
};

module.exports = function (access = {}) {
  console.log(access);
  return function (req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, config.get('jwtSecret'));

      //console.log(access);
      //console.log(decoded.user);
      if (decoded.user && access) {
        if (!checkForAccess(decoded.user.groups, access)) {
          return res.status(401).json({ msg: 'Authorization denied' });
        }
      }

      req.user = decoded.user;
      //console.log(req.user.groups[0]);
      next();
    } catch (error) {
      console.log(error);
      res.status(401).json({ msg: 'Token is not valid' });
    }
  };
};
