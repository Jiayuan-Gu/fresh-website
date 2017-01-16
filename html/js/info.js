function render_customer_info(customer_info) {
  $('#username').text(customer_info.customer_id);
  $('#nickname').text(customer_info.nickname);
  $('#sex').text(customer_info.sex);
  $('#contact').text(customer_info.contact);
}

function render_order(order,product_list) {
  title = '<div class="panel-heading row"><span class="col-sm-6 col-md-6">提货码：'+order.delivery_code+'</span><span class="col-xs-6 col-md-6">下单时间：'+String(order.time)+'</span><span class="col-xs-6 col-md-6">提货点:'+order.delivery_name+'</span><span class="col-xs-6 col-md-6">所属行政区:'+order.district_name+'</span></div>';
  $('#order_display').append(title);
  var $table = $('<table></table>');
  $table.addClass("panel-body table table-bordered");
  thead = '<thead><tr><th>商品名称</th><th>价格</th><th>数量</th><th>总价</th></tr></thead>';
  $table.append(thead);
  for (var i in product_list) {
    product = product_list[i];
    tbody = '<tbody><tr><td>'+product.product_name+'</td><td>'+product.price+'</td><td>'+product.quantity+'</td><td>'+product.total+'</td></tr></tbody>';
    $table.append(tbody);
  }
  $('#order_display').append($table);
}

// 页面初始化
function init(){
  render_header();  //渲染导航栏
  $.get('info_query_customer',function (data,status) {
    if(status=="success"){
      console.log('获得用户信息回应');
      var customer_info = JSON.parse(data);
      if (customer_info.error){
        console.error('用户信息查询失败');
      }else{
        render_customer_info(customer_info);
      }
    }else{
      console.error('无法连接到服务器');
    }
  });
  $.get('info_query_order',function (data,status) {
    if(status=="success"){
      console.log('获得用户订单回应');
      var data = JSON.parse(data);
      if (data.error){
        console.error('用户订单查询失败');
      }else{
        var order_list = data[0],product_list = data[1],query_num = data[2];
        if (query_num==1){
          render_order(order_list[0],product_list);
        }else {
          for (var i in order_list) {
            render_order(order_list[i],product_list[i]);
          }
        }
      }
    }else{
      console.error('无法连接到服务器');
    }
  });
  console.log("个人信息界面");
}

$(document).ready(init);
