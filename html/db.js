//引入数据库模块
var mysql = require('mysql');
var database_name = 'menagerie';

function create_connection(user_info){
  var connetion = mysql.createConnection({
    host:'localhost',
    user:user_info.user,
    password:user_info.password,
    database:database_name
  });
  return connection;
}

function query(sql_string,callback){
  
}

exports.query = query;
