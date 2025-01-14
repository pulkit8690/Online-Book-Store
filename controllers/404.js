const path=require('path');

const error=(req, res, next) => {
    res.status(404).render('404', { pageTitle: 'Page Not Found',path:'' });
};
exports.get404=error;

exports.get505=(req, res, next) => {
    res.status(500).render('500', { pageTitle: 'Error!',path:'' });
};