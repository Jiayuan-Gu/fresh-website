var mysql = require('mysql');
var builder = require('xmlbuilder');
var inspect = require('util').inspect;


function export_xml(connection,res,start_datetime,end_datetime){
  var sqlString1 = 'select * from (select distinct delivery_name,district_id,district_name from orders natural join repository where time between ? and ?) as delivery_have_orders natural join delivery;';
  var escape1 = [start_datetime,end_datetime];

  connection.query(sqlString1,escape1,function (err1,deliverys) {
    if (err1) {
      console.error('查询提货点失败'+err1.stack);
      connection.end();
      res.end('没有对应时间的xml');
    }else{
      console.log(deliverys);

      var sqlString2 = '';
      var escape2 = new Array();

      for(var i in deliverys){
        var dp = deliverys[i];
        sqlString2 = sqlString2 + 'select * from (orders natural join orders_have_product natural join product) where (time between ? and ?) and delivery_name=? and district_id=? order by delivery_code;';
        escape2.push(start_datetime,end_datetime,dp.delivery_name,dp.district_id);
      }

      connection.query(sqlString2,escape2,function(err2, orders){
        if (err2) {
          console.error('获取订单信息失败'+err2.stack);
          connection.end();
          res.end('遇到一些错误');
          return;
        }

        // console.log(orders);
        var DeliveryPoints = new Array();
        for (var i in orders){
          var dp = deliverys[i];
          var DeliveryPoint = new Object(),BasicInfo = new Object(), OtherInfo = new Object();
          BasicInfo = {
            DeliveryName: dp.delivery_name,
            DistrictID: dp.district_id,
            Address: dp.contact,
            OpenTime: dp.open_time,
            CloseTime: dp.close_time
          };
          OtherInfo = {
            Score: dp.rate
          };
          DeliveryPoint = {
            BasicInfo: BasicInfo,
            OtherInfo: OtherInfo
          }
          DeliveryPoints.push(DeliveryPoint);

          var dp_orders = orders[i];
          var Orders = new Array(),Products=new Array();
          var cur_code = "";

          for (var j in dp_orders){
            order = dp_orders[j];
            Product = {
              ProductName:order.product_name,
              Type:order.type,
              ProductPrice:order.price,
              Quantity:order.quantity
            }
            Products.push({Product:Product});
            if (order.delivery_code!=cur_code){
              //新的订单开始
              if (Orders.length!=0){
                Orders[Orders.length-1].Order.Products=Products;
                Products = new Array();
              }
              // console.log(order.time);
              Orders.push({Order:
                {'DeliveryCode':order.delivery_code,
                'UserName':order.customer_id,
                'Time':String(order.time)}
              });
            }
            cur_code = order.delivery_code;
          }
          console.log('finish')
          Orders[Orders.length-1].Order.Products=Products;
          DeliveryPoints[DeliveryPoints.length-1].OtherInfo.Orders=Orders;
        }

        console.log(DeliveryPoints);
        var xml = builder.create({'DeliveryPoints':{'DeliveryPoint':DeliveryPoints}}, {encoding: 'utf-8'}).end({pretty: true});
        connection.end();
        res.end(xml);
      });
    }
  });
}

exports.export_xml = export_xml;
