// 渲染购物车项
function render_cart_item(item) {
  $trow = $('<tr></tr>');
  content = '<td>'+item.product_name+'</td><td>'+item.delivery_name+'</td><td>'+item.district_name+'</td><td>'+item.price+'</td><td>'+item.quantity+'</td><td>'+item.total+'</td>';
  $trow.append(content);
  $trow.attr('product_name',item.product_name);
  $trow.attr('delivery_name',item.delivery_name);
  $trow.attr('district_id',item.district_id);

  $td = $('<td></td>');
  $td.addClass("form-inline");
  $button = $('<button></button>');
  $button.addClass("btn btn-warning form-control");
  $button.text("删除");
  $button.click(function () {
    remove_cart_item($(this));
  });

  $td.append($button);
  $trow.append($td);
  $('#cart_display').append($trow);
}

// 渲染促销项
function render_onsale_item(item) {
  $trow = $('<tr></tr>');
  content = '<td>'+item.product_name+'</td><td>'+item.delivery_name+'</td><td>'+item.district_name+'</td><td>'+item.price+'</td><td>'+item.unit+'</td>';
  $trow.append(content);
  $trow.attr('product_name',item.product_name);
  $trow.attr('delivery_name',item.delivery_name);
  $trow.attr('price',item.price);
  $trow.attr('district_id',item.district_id);
  $trow.attr('district_name',item.district_name);

  $td = $('<td></td>');
  $td.addClass("form-inline");
  $number = $('<input></input>');
  $number.addClass("form-control");
  $number.attr('type','number');
  $number.attr('min',1);
  $button = $('<button></button>');
  $button.addClass("btn btn-primary form-control");
  $button.text("添加");
  $button.click(function () {
    add_to_cart($(this));
  });
  $td.append($number,$button);
  $trow.append($td);
  $('#onsale_display').append($trow);
}

//获取购物车信息
function fetch_cart(){
  $.get('cart_fetch_cart',function (data,status) {
    if(status=="success"){
      console.log('获得购物车信息回应');
      var cart_list = JSON.parse(data);
      if (cart_list.error) {
        console.error('购物车查询错误');
        return;
      }
      for (var i in cart_list) {
        render_cart_item(cart_list[i]);
      }
      fetch_onsale();
    }else{
      console.error('无法连接到服务器');
    }
  });
}

//获取促销信息
function fetch_onsale() {
  $.get('cart_fetch_onsale',function (data,status) {
    if(status=="success"){
      console.log('获得推荐信息');
      var onsale_list = JSON.parse(data);
      if (onsale_list.error){
        console.error('查询错误');
        return;
      }
      if (onsale_list.length===undefined||onsale_list.length==0){
        console.log('没有达到推荐要求')
        return;
      }

      $('#cart').after('<table id="cart" class="container table-bordered"><thead class="bg-info"><tr><th>商品名称</th><th>提货点名称</th><th>行政区名</th><th>价格</th><th>单位</th><th>操作</th></tr></thead><tbody id="onsale_display" class="bg-warning"></tbody></table>');
      $('#cart').after('<div class="container page-header"><h2 class="text-center"><span class="glyphicon glyphicon-thumbs-up"></span>推荐商品</h2></div>');

      for (var i in onsale_list) {
        render_onsale_item(onsale_list[i]);
      }
    }else{
      console.error('无法连接到服务器');
    }
  });
}

//移除购物车内容
function remove_cart_item($button) {
  $trow = $button.parent().parent();
  var product_name = $trow.attr('product_name');
  var delivery_name=$trow.attr('delivery_name');
  var district_id=$trow.attr('district_id');

  var options = {
    url:'/cart_remove_item',
    type:'get',
    data:{'product_name':product_name,'delivery_name':delivery_name,'district_id':district_id},
    dataType:'text',
    success:function(status) {
      console.log('获得服务器关于购物车的响应');
      if (status == "success"){
        success('成功从购物车删除');
        $trow.remove();
      }else{
        failure('未成功从购物车删除');
      }
    },
    error:get_error
  };
  $.ajax(options);
}

//将推荐商品加入购物车内容
function add_to_cart($button) {
  var $trow = $button.parent().parent();
  var product_name=$trow.attr('product_name');
  var district_id = $trow.attr('district_id');
  var district_name = $trow.attr('district_name');
  var delivery_name = $trow.attr('delivery_name');
  var price = $trow.attr('price');
  var quantity=$button.prev().val();
  var item = {'product_name':product_name,'delivery_name':delivery_name,'district_id':district_id,'district_name':district_name,'price':price,'quantity':quantity};

  var options = {
    url:'/cart_add_to_cart',
    type:'get',
    data:item,
    dataType:'text',
    success:function(status) {
      console.log('收到加入购物车请求回复');
      if (status == "success"){
        success('成功加入购物车');
        $trow.remove();
        item.total = price*quantity;
        render_cart_item(item);
      }else{
        failure('未成功加入购物车');
      }
    },
    error:get_error
  };
  $.ajax(options);
}

// 页面初始化
function init(){
  render_header();  //渲染导航栏
  fetch_cart();
  console.log('购物车界面');
}

$(document).ready(init);
