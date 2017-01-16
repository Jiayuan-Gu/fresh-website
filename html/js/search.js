// 渲染商品
function render_product(item,type) {
  var $trow = $('<tr></tr>');
  if (type=="price"){
    var content = '<td>'+item.customer_id+'</td><td>'+item.sum_total+'</td>';
  }else if (type=="product") {
    var content = '<td>'+item.product_name+'</td>';
  }
  $trow.append(content);
  $('#product_display').append($trow);
}

// 渲染提货点
function render_dp(dp,type) {
  var $trow = $('<tr></tr>');
  if (type=="time"){
    var content = '<td>'+dp.delivery_name+'</td><td>'+dp.district_name+'</td><td>'+dp.duration/10000+'</td>';
  }else if (type=="sale") {
    var content = '<td>'+dp.delivery_name+'</td>';
  }

  $trow.append(content);
  $('#dp_display').append($trow);
}

//查询提货点
function query_dp() {
  var query_type = $('#dp_form [name="query_type"]').val();
  var options = {
    url:'/search_query_dp',
    type:'get',
    data:{'query_type':query_type},
    dataType:'text',
    success:function(dp_list,status) {
      console.log('获得提货点查询结果');

      dp_list = JSON.parse(dp_list);
      if (dp_list.error){
        console.error('查询失败');
        return;
      }
      $('#display').empty();
      if(query_type=="time"){
        $('#display').append('<thead class="bg-danger"><tr><th>提货点名称</th><th>所属行政区</th><th>营业时长</th></tr></thead><tbody id="dp_display" class="bg-warning"></tbody>');
      }else if (query_type=="sale"){
        $('#display').append('<thead class="bg-danger"><tr><th>提货点名称</th></tr></thead><tbody id="dp_display" class="bg-warning"></tbody>');
      }
      for (var i in dp_list) {
        render_dp(dp_list[i],query_type);
      }
    },
    error:get_error
  };
  $.ajax(options);
}

//查询提货点
function query_product() {
  var query_type = $('#product_form [name="query_type"]').val();
  var query_info = $('#product_form [name="info"]').val();
  var options = {
    url:'/search_query_product',
    type:'get',
    data:{'query_type':query_type,'query_info':query_info},
    dataType:'text',
    success:function(product_list,status) {
      console.log('获得商品查询结果');
      product_list = JSON.parse(product_list);
      if (product_list.error){
        console.error('查询失败');
        return;
      }

      $('#display').empty();
      if (query_type=="price"){
        $('#display').append('<thead class="bg-info"><tr><th>客户名</th><th>购买商品价格汇总</th></tr></thead><tbody id="product_display" class="bg-success"></tbody>');
      }else if (query_type=="product") {
        $('#display').append('<thead class="bg-info"><tr><th>商品名称</th></tr></thead><tbody id="product_display" class="bg-success"></tbody>');
      }
      for (var i in product_list) {
        render_product(product_list[i],query_type);
      }
    },
    error:get_error
  };
  $.ajax(options);
}
// 页面初始化
function init(){
  render_header();  //渲染导航栏
  $('#query_dp_btn').click(query_dp);
  $('#query_product_btn').click(query_product);
  console.log('搜索界面');
}

$(document).ready(init);
