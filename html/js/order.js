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

function query_order() {
  var delivery_code = $('#code_input').val();
  if(delivery_code==''||delivery_code===undefined){
    alert('请输入提货码');
    return false;
  }
  var options = {
    url:'/order_query_order',
    type:'get',
    data:{'delivery_code':delivery_code},
    dataType:'text',
    success:function(data) {
      console.log('获得提货单信息回应');
      data = JSON.parse(data);
      if (data.error){
        console.error('查询提货单失败');
        return;
      }
      if (data.isEmpty){
        failure('没有对应的提货单');
        return;
      }
      $('#order_display').empty();
      render_order(data.order[0],data.product_list);
    },
    error:get_error
  };
  $.ajax(options);
}

function download_order(){
  $('#download_form').submit();
}
// 页面初始化
function init(){
  render_header();  //渲染导航栏
  $('#query_btn').click(query_order);
  $('#download_btn').click(download_order);
  console.log('提货单界面');
}

$(document).ready(init);
