const moment = require('moment');

exports.single = (date) => {
	return moment(date).format('D MMM');
};

exports.dateTime = (date) => {
	return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

exports.fromTo = (fromDate, toDate) => {
	var from = moment(fromDate);
	var to = moment(toDate);
	if (moment(fromDate).isSame(toDate, 'month')) {
		return from.format('D-') + to.format('D MMM');
	} else {
		return from.format('D MMM') + ' - ' + to.format('D MMM');
	}
};
