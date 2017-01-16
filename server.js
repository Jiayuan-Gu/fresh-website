/*服务器建立*/
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var toXml = require('./toXml.js');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('html'));

/* 辅助函数*/
var assert = require('assert');
var ts = require('time-stamp');
var hasha = require('hasha');

// 检查用户类型
function check_user_type(user_info,type_list){
  return type_list.contain(user_info.type);
}

//数据库模块
var mysql = require('mysql');
var database_name = 'freshdirect';
var visitor_info = {username:"visitor",password:"visitor",type:'VISITOR'};

function create_connection(user_info){
  if (user_info.type == 'VISITOR') {
    user_info.username = "visitor";
    user_info.password = "visitor";
  }
  var connection = mysql.createConnection({
    host:'localhost',
    user:user_info.username,
    password:user_info.password,
    database:database_name,
    multipleStatements:true
  });
  return connection;
}

/*服务器主逻辑*/
/*主页逻辑*/

//主页查询行政区信息
app.get('/index_fetch_district', function (req, res) {
  console.log('主页发送行政区查询请求');
  console.log(req.cookies);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var sqlString = 'select * from repository;';

  connection.query(sqlString,function (err,rows,fields) {
    var response = new Object();
    if(err){
      console.error('数据库查询失败:'+err.stack);
      response.error = true;
    }else{
      console.log(rows);
      response = rows;
      console.log('查询行政区成功');
    }
    connection.end();
    res.end(JSON.stringify(response));
  });
})

app.get('/index_query_district', function (req, res) {
  console.log('主页发送提货点查询请求');
  console.log(req.cookies);
  console.log(req.query);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var response = new Object();
  if (req.query.type == "rate"){
    var sqlString = 'select * from delivery where district_id=? order by rate desc;';
    var escape = req.query.district_id;
  }else if (req.query.type == "order") {
    var sqlString = 'select delivery.delivery_name,district_id,address,contact,rate,open_time,close_time from (select delivery.delivery_name, count(*) as order_num from delivery natural join orders natural join orders_have_product  group by delivery.delivery_name ) as delivery_have_order right join delivery on delivery_have_order.delivery_name = delivery.delivery_name where delivery.district_id = ? order by order_num desc;';
    var escape = req.query.district_id;
  }else{
    response.error = true;
    res.end(JSON.stringify(response));
    return;
  }

  connection.query(sqlString,escape,function (err,rows,fields) {
    if(err){
      console.error('数据库查询失败:'+err.stack);
      response.error = true;
    }else{
      console.log(rows);
      response = rows;
      console.log('查询行政区内提货点成功');
    }
    connection.end();
    res.end(JSON.stringify(response));
  });

})

app.get('/index_query_delivery_point', function (req, res) {
  console.log('主页发送商品查询请求');
  console.log(req.cookies);
  console.log(req.query);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var response = new Object();

  var sqlString = 'select product_name,type,price,unit from (product natural join delivery_have_product) where delivery_name=? and district_id=?';
  var escape = [req.query.delivery_name,req.query.district_id];

  connection.query(sqlString,escape,function (err,rows,fields) {
    var response = new Object();
    if(err){
      console.error('数据库查询失败:'+err.stack);
      response.error = true;
    }else{
      console.log(rows);
      response = rows;
      console.log('查询提货点商品成功');
    }
    connection.end();
    res.end(JSON.stringify(response));
  });
})

app.get('/index_add_to_cart', function (req, res) {
  console.log('主页发送添加购物车请求');
  console.log(req.cookies);
  console.log(req.query);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);

  var sqlString = 'insert into cart value(?,?,?,?,?,?,?);';
  var escape = [user_info.username,req.query.product_name,req.query.delivery_name,req.query.district_id,req.query.price,req.query.quantity,req.query.price*req.query.quantity];

  console.log(escape);
  connection.query(sqlString,escape,function (err,rows,fields) {
    var response = "";
    if(err){
      console.error('数据库插入失败:'+err.stack);
      response = "failure";
    }else{
      console.log('加入购物车成功');
      response = "success";
    }
    connection.end();
    res.end(response);
  });
})

/*登录逻辑*/
//用户登录
app.get('/login',function (req,res) {
  console.log(req.query);
  console.log(req.cookies);
  console.log('服务器接收登录请求');

  var user_info = {username:req.query.username,password:req.query.password};
  var connection  = create_connection(user_info);
  connection.connect(function(err){
    if (err){
      console.error('数据库无法连接:'+err.stack);
      res.end('数据库无法连接:可能是服务器故障或是用户名密码不正确');
    }else{
      sqlString = 'select * from user where username=?;';
      connection.query(sqlString,[user_info.username],function (err,rows,fields) {
        if(err){
          console.error('数据库查询失败:'+err.stack);
          res.end('查询失败');
        }else{
          console.log(rows);
          assert(rows.length==1,'用户只有一条信息才对');
          res.clearCookie();
          res.cookie('user_info',JSON.stringify(rows[0]));
          res.redirect('/index.html');
          console.log('服务器完成登录请求');
        }
      });
    }
    connection.end();
  });
})

//用户注册逻辑
app.get('/register',function (req,res) {
  console.log(req.query);
  console.log(req.cookies);
  console.log('注册请求');
  res.clearCookie();
  var user_info = req.query;
  var connection  = create_connection(visitor_info);

  var sqlString = "";
  sqlString = sqlString + 'CREATE USER ?@localhost IDENTIFIED BY ?;';
  sqlString = sqlString + 'GRANT SELECT,INSERT,UPDATE,DELETE,EXECUTE ON '+ database_name+'.* to ?@localhost IDENTIFIED by ?;';
  sqlString = sqlString + 'flush privileges;';
  sqlString = sqlString + 'insert into user value(?,?,"CUSTOMER");';
  sqlString = sqlString + 'insert into customer value(?,?,?,?);';
  for (key in user_info){
    if (user_info[key] == ""){
      user_info[key] = null;
    }
  }
  escape = [user_info.username,user_info.password,user_info.username,user_info.password,user_info.username,user_info.password,user_info.username,user_info.nickname,user_info.contact,user_info.sex];
  connection.query(sqlString,escape,function (err,rows,fields) {
    if(err){
      console.error('数据库操作失败:'+err.stack);
      res.end('注册失败');
    }else{
      console.log(rows);
      res.clearCookie();
      res.cookie('user_info',JSON.stringify({username:user_info.username,password:user_info.password,type:'CUSTOMER'}));
      res.redirect('/index.html');
      console.log('服务器完成注册请求');
    }
    connection.end();
  });
})

//注销逻辑
app.get('/logout',function (req,res) {
  console.log(req.cookies);
  console.log('注销请求');
  res.clearCookie('user_info');
  res.redirect('/login.html');
})

/*个人信息和订单查询*/
//个人信息查询
app.get('/info_query_customer',function (req,res) {
  console.log('请求个人信息');
  console.log(req.cookies);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);

  var sqlString = 'select * from customer where customer_id=?;';
  var escape = [user_info.username];

  connection.query(sqlString,escape,function (err,rows,fields) {
    var response = new Object();
    if(err){
      console.error('数据库查询失败:'+err.stack);
      response.error = true;
    }else{
      console.log('个人信息查询成功');
      assert(rows.length==1,'用户只有一条信息才对');
      response = rows[0];
    }
    connection.end();
    res.end(JSON.stringify(response));
  });
})

//订单查询
app.get('/info_query_order',function (req,res) {
  console.log('请求订单信息');
  console.log(req.cookies);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);

  var sqlString1 = 'select delivery_code,delivery_name,district_name,time from orders natural join repository where customer_id=?;';
  var escape1 = [user_info.username];
  var response = new Object();

  connection.query(sqlString1,escape1,function (err1,rows1) {
    if(err1){
      console.error('数据库查询失败:'+err1.stack);
      response.error = true;
      connection.end();
      res.end(JSON.stringify(response));
    }else{
      console.log('订单提货码查询成功');
      console.log(rows1);
      if (rows1.length==0){
        connection.end();
        res.end(JSON.stringify(response));
      }else {
        var sqlString2 = "";
        var escape2 = new Array();
        for (var i in rows1) {
          row = rows1[i];
          sqlString2 = sqlString2 + "select * from orders_have_product where delivery_code=?;";
          escape2.push(row.delivery_code);
        }
        connection.query(sqlString2,escape2,function (err2,rows2){
          if(err2){
            console.error('数据库查询失败:'+err.stack);
            response.error = true;
          }else{
            console.log('订单提货码对应商品查询成功');
            console.log(rows2);
            response = [rows1,rows2,rows1.length];
          }
          connection.end();
          res.end(JSON.stringify(response));
        });
      }
    }
  });
})

/*购物车*/
//查询购物车信息
app.get('/cart_fetch_cart', function (req, res) {
  console.log('购物车查询请求');
  console.log(req.cookies);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var sqlString = 'select * from (cart natural join repository) where customer_id=?;';
  var escape = [user_info.username];

  connection.query(sqlString,escape,function (err,rows,fields) {
    var response = new Object();
    if(err){
      console.error('数据库查询失败:'+err.stack);
      response.error = true;
    }else{
      console.log(rows);
      response = rows;
      console.log('查询购物车成功');
    }
    connection.end();
    res.end(JSON.stringify(response));
  });
})

//查询促销信息
app.get('/cart_fetch_onsale', function (req, res) {
  console.log('促销查询请求');
  console.log(req.cookies);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var sqlString1 = 'select * from recommend where customer_id=?;';
  var escape1 = [user_info.username];
  var response = new Object();

  connection.query(sqlString1,escape1,function (err1,rows1) {
    if(err1){
      console.error('推荐表查询失败:'+err.stack);
      response.error = true;
      connection.end();
      res.end(JSON.stringify(response));
    }else{
      console.log(rows1);
      if (rows1.length){
        var sqlString2 = 'select * from (onsale natural join delivery_have_product natural join repository natural join product) where district_id in (select district_id from cart where customer_id=?);';
        var escape2 = [user_info.username];

        connection.query(sqlString2,escape2,function (err2,rows2){
          if(err2){
            console.error('促销产品查询失败:'+err.stack);
            response.error = true;
          }else{
            console.log(rows2);
            response = rows2;
            console.log('查询促销商品成功');
          }
          connection.end();
          res.end(JSON.stringify(response));
        });
      }else{
        connection.end();
        res.end(JSON.stringify(response));
      }
      console.log('查询推荐表成功');
    }
  });
})

//移除购物车项
app.get('/cart_remove_item', function (req, res) {
  console.log('移除购物车请求');
  console.log(req.cookies);
  console.log(req.query);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var response = new Object();

  var sqlString = 'delete from cart where customer_id=? and product_name=? and delivery_name=? and district_id=?;';
  var escape = [user_info.username,req.query.product_name,req.query.delivery_name,req.query.district_id];
  console.log(escape);

  connection.query(sqlString,escape,function (err,rows,fields) {
    if(err){
      console.error('数据库查询失败:'+err.stack);
      res.end("failure");
    }else{
      res.end("success");
    }
  });
})

app.get('/cart_add_to_cart', function (req, res) {
  console.log('促销商品加入购物车大请求');
  console.log(req.cookies);
  console.log(req.query);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);

  var sqlString = 'insert into cart value(?,?,?,?,?,?,?);';
  var escape = [user_info.username,req.query.product_name,req.query.delivery_name,req.query.district_id,req.query.price,req.query.quantity,req.query.price*req.query.quantity];

  console.log(escape);
  connection.query(sqlString,escape,function (err,rows,fields) {
    var response = "";
    if(err){
      console.error('数据库插入失败:'+err.stack);
      response = "failure";
    }else{
      console.log('加入购物车成功');
      response = "success";
    }
    connection.end();
    res.end(response);
  });
})

app.get('/cart_generate_order',function (req,res) {
  console.log('请求订单信息');
  console.log(req.cookies);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);

  var sqlString1 = 'select distinct delivery_name,district_id from cart where customer_id=?;';
  var escape1 = [user_info.username];

  connection.query(sqlString1,escape1,function (err1,rows1) {
    if(err1){
      console.error('订单分类查询失败:'+err1.stack);
      connection.end();
      res.end('订单生成错误');
    }else{
      console.log('订单提货码查询成功');
      console.log(rows1);
      if (rows1.length==0){
        console.log('没有订单可以生成');
        connection.end();
        res.redirect('/cart.html');
      }else {
        var sqlString2 = "";
        var escape2 = new Array();
        var timestamp = ts('YYYY-MM-DD HH:mm:ss');

        for (var i in rows1) {
          row = rows1[i];
          var delivery_code = hasha(user_info.username+row.delivery_name+row.district_id+timestamp).substr(0,16);
          console.log(delivery_code);
          sqlString2 = sqlString2 + "insert into orders value(?,?,?,?,?);";
          escape2.push(delivery_code,user_info.username,row.delivery_name,row.district_id,timestamp);
          sqlString2 = sqlString2 + "insert into orders_have_product (select ? as delivery_code,product_name,price,quantity,total from cart where customer_id=? and delivery_name=? and district_id=?);";
          escape2.push(delivery_code,user_info.username,row.delivery_name,row.district_id);
        }
        console.log('时间戳:'+timestamp);
        console.log(sqlString2);
        console.log(escape2);

        connection.query(sqlString2,escape2,function (err2,rows2){
          if(err2){
            console.error('订单插入失败:'+err2.stack);
            connection.end();
            res.end('订单生成错误');
          }else{
            console.log('订单插入成功');
            connection.end();
            res.redirect('/cart_empty_cart');
          }
        });
      }
    }
  });
})

app.get('/cart_empty_cart',function (req,res) {
  console.log('清空购物车请求');
  console.log(req.cookies);
  console.log(req.query);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);

  var sqlString = 'delete from cart where customer_id=?;';
  var escape = [user_info.username];

  connection.query(sqlString,escape,function (err,rows,fields) {
    if(err){
      console.error('数据库查询失败:'+err.stack);
      res.end("清空购物车遇到一些问题");
    }else{
      res.redirect('/cart.html');
    }
  });
})

/*提货单管理*/
//查询提货单
app.get('/order_query_order',function (req,res) {
  console.log('根据提货码查询订单信息');
  console.log(req.query);
  console.log(req.cookies);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);

  var sqlString1 = 'select * from orders natural join repository where delivery_code=?;';
  var escape1 = [req.query.delivery_code];
  var response = new Object();

  connection.query(sqlString1,escape1,function (err1,rows1) {
    if(err1){
      console.error('数据库查询失败:'+err1.stack);
      response.error = true;
      connection.end();
      res.end(JSON.stringify(response));
    }else{
      console.log('订单提货码查询成功');
      console.log(rows1);
      if (rows1.length==0){
        response.isEmpty = true;
        connection.end();
        res.end(JSON.stringify(response));
      }else if(rows1.length==1){
        sqlString2 = "select * from orders_have_product where delivery_code=?;";
        var escape2 = [req.query.delivery_code];
        connection.query(sqlString2,escape2,function (err2,rows2){
          if(err2){
            console.error('数据库查询失败:'+err.stack);
            response.error = true;
          }else{
            console.log('订单提货码对应商品查询成功');
            console.log(rows2);
            response.order = rows1;
            response.product_list = rows2;
          }
          connection.end();
          res.end(JSON.stringify(response));
        });
      }else {
        console.error('未知情况');
      }
    }
  });
})
//提货单下载
app.get('/order_download',function (req,res) {
  console.log(req.query);
  console.log(req.cookies);
  console.log('提货单下载请求');

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  toXml.export_xml(connection,res,req.query.start_datetime,req.query.end_datetime);
  // console.log(customer_info);
  // res.download( __dirname + "/html/sounds/" + "sound1.ogg");
})

/*管理用户和提货点*/
//查询用户信息
app.get('/management_fetch_user',function (req,res) {
  console.log('管理界面用户查询请求');
  console.log(req.cookies);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var sqlString = 'select username,type from user where type!="VISITOR";';

  connection.query(sqlString,function (err,rows,fields) {
    var response = new Object();
    if(err){
      console.error('数据库查询失败:'+err.stack);
      response.error = true;
    }else{
      console.log(rows);
      response = rows;
      console.log('查询用户成功');
    }
    connection.end();
    res.end(JSON.stringify(response));
  });
})

//删除用户
app.get('/management_remove_user',function (req,res) {
  console.log('管理员移除用户请求');
  console.log(req.cookies);
  console.log(req.query);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var response = new Object();

  var sqlString = 'drop user ?@localhost;delete from user where username=?;flush privileges;';
  var escape = [req.query.username,req.query.username];
  console.log(escape);

  connection.query(sqlString,escape,function (err,rows,fields) {
    if(err){
      console.error('数据库查询失败:'+err.stack);
      res.end("failure");
    }else{
      res.end("success");
    }
  });
})

//添加用户
app.get('/management_add_user',function (req,res) {
  console.log(req.query);
  console.log(req.cookies);
  console.log('增加用户请求请求');

  var user_info = req.query;
  var connection  = create_connection(JSON.parse(req.cookies.user_info));

  for (key in user_info){
    if (user_info[key] == ""){
      user_info[key] = null;
    }
  }

  if (user_info.type=="CUSTOMER"){
    var sqlString = "";
    sqlString = sqlString + 'CREATE USER ?@localhost IDENTIFIED BY ?;';
    sqlString = sqlString + 'GRANT SELECT,INSERT,UPDATE,DELETE,EXECUTE ON '+ database_name+'.* to ?@localhost IDENTIFIED by ?;';
    sqlString = sqlString + 'flush privileges;';
    sqlString = sqlString + 'insert into user value(?,?,"CUSTOMER");';
    sqlString = sqlString + 'insert into customer value(?,?,?,?);';
    var escape = [user_info.username,user_info.password,user_info.username,user_info.password,user_info.username,user_info.password,user_info.username,user_info.nickname,user_info.contact,user_info.sex];
  }else if (user_info.type=="DELIVERER") {
    var sqlString = "";
    sqlString = sqlString + 'CREATE USER ?@localhost IDENTIFIED BY ?;';
    sqlString = sqlString + 'GRANT ALL ON '+ database_name+'.* to ?@localhost IDENTIFIED by ?;';
    sqlString = sqlString + 'flush privileges;';
    sqlString = sqlString + 'insert into user value(?,?,"DELIVERER");';
    var escape = [user_info.username,user_info.password,user_info.username,user_info.password,user_info.username,user_info.password];
  }else{
    console.error('未知类型:'+user_info.type);
    return;
  }


  connection.query(sqlString,escape,function (err,rows,fields) {
    if(err){
      console.error('数据库操作失败:'+err.stack);
      res.end('加入用户失败');
    }else{
      console.log('服务器加入用户');
      res.redirect('/management.html');
    }
    connection.end();
  });
})

//查询提货点信息
app.get('/management_fetch_dp',function (req,res) {
  console.log('管理界面提货点查询请求');
  console.log(req.cookies);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var sqlString = 'select * from (delivery natural join repository);';

  connection.query(sqlString,function (err,rows,fields) {
    var response = new Object();
    if(err){
      console.error('数据库查询失败:'+err.stack);
      response.error = true;
    }else{
      // console.log(rows);
      response = rows;
      console.log('查询提货点成功');
    }
    connection.end();
    res.end(JSON.stringify(response));
  });
})

//删除提货点
app.get('/management_remove_dp',function (req,res) {
  console.log('管理员移除提货点请求');
  console.log(req.cookies);
  console.log(req.query);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var response = new Object();

  var sqlString = 'delete from delivery where delivery_name=? and district_id=?;';
  var escape = [req.query.delivery_name,req.query.district_id];
  console.log(escape);

  connection.query(sqlString,escape,function (err,rows,fields) {
    if(err){
      console.error('数据库查询失败:'+err.stack);
      res.end("failure");
    }else{
      res.end("success");
    }
  });
})

//增加提货点
app.get('/management_add_dp', function (req, res) {
  console.log('增加提货点请求');
  console.log(req.cookies);
  console.log(req.query);

  var user_info = JSON.parse(req.cookies.user_info);
  var dp_info = req.query;
  var connection  = create_connection(user_info);

  var sqlString = 'insert into delivery (select ? as delivery_name,district_id,? as address,? as contact,? as rate,? as open_time,? as close_time from repository where district_name=?);';
  var escape = [dp_info.delivery_name,dp_info.address,dp_info.contact,dp_info.rate,dp_info.open_time,dp_info.close_time,dp_info.district_name];

  console.log(escape);
  connection.query(sqlString,escape,function (err,rows,fields) {
    if(err){
      console.error('数据库操作失败:'+err.stack);
      res.end('加入提货点失败');
    }else{
      console.log('服务器加入提货点');
      res.redirect('/management.html');
    }
    connection.end();
  });
})

/*搜索界面*/
//搜索提货点
app.get('/search_query_dp',function (req,res) {
  console.log('搜索提货点信息');
  console.log(req.cookies);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var type = req.query.query_type;

  if (type=="time"){
    console.log('营业时间查询');
    var sqlString = 'select delivery_name, district_name, (close_time - open_time) as duration from delivery natural join repository where close_time - open_time <= all (select close_time - open_time from delivery);';
    connection.query(sqlString,function (err,rows,fields) {
      var response = new Object();
      if(err){
        console.error('数据库查询失败:'+err.stack);
        response.error = true;
      }else{
        console.log('营业时间查询成功');
        // console.log(rows);
        response = rows;
      }
      connection.end();
      res.end(JSON.stringify(response));
    });
  }else if (type=="sale") {
    console.log('营业时间查询');
    var sqlString = 'select delivery_name from ( select delivery_name, sum(case when product_name = "苹果" Then quantity when product_name = "橘子" Then -quantity else 0 end) as diff from orders natural join orders_have_product group by delivery_name) as delivery_diff where delivery_diff.diff > 0;';
    connection.query(sqlString,function (err,rows,fields) {
      var response = new Object();
      if(err){
        console.error('数据库查询失败:'+err.stack);
        response.error = true;
      }else{
        console.log('销售查询成功');
        // console.log(rows);
        response = rows;
      }
      connection.end();
      res.end(JSON.stringify(response));
    });
  }else{
    console.error('未知类型');
  }
})

app.get('/search_query_product', function (req, res) {
  console.log('搜索商品相关信息');
  console.log(req.cookies);
  console.log(req.query);

  var user_info = JSON.parse(req.cookies.user_info);
  var connection  = create_connection(user_info);
  var type = req.query.query_type;
  var info = req.query.query_info;

  if (type=="price"){
    console.log('价格汇总查询');
    var sqlString = 'select o.customer_id as customer_id,sum(o.total) as sum_total from o group by o.customer_id having ? in (select product_name from (orders natural join orders_have_product) where customer_id = o.customer_id);';
    var escape = [info];
    connection.query(sqlString,escape,function (err,rows,fields) {
      var response = new Object();
      if(err){
        console.error('数据库查询失败:'+err.stack);
        response.error = true;
      }else{
        console.log('价格汇总查询成功');
        // console.log(rows);
        response = rows;
      }
      connection.end();
      res.end(JSON.stringify(response));
    });
  }else if(type=="product") {
    console.log('销量间查询');
    var sqlString = 'select product_name from t where district_name = ? and sum_total > (select avg(sum_total) from t where district_name = ? group by(district_name));';
    var escape = [info,info];

    connection.query(sqlString,escape,function (err,rows,fields) {
      var response = new Object();
      if(err){
        console.error('数据库查询失败:'+err.stack);
        response.error = true;
      }else{
        console.log('销售查询成功');
        // console.log(rows);
        response = rows;
      }
      connection.end();
      res.end(JSON.stringify(response));
    });
  }else{
    console.error('未知类型');
  }
})

var server = app.listen(8081, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
})
