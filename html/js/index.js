/*界面渲染*/
//渲染行政区选项表
function render_district(district_item) {
  var $option = $('<option></option>');
  $option.attr('value',district_item.district_id);
  $option.text(district_item.district_name);
  $('#district_select').append($option);
}

//渲染提货点
function render_delivery_point(dp) {
  var $div = $('<div></div>');
  $div.attr('delivery_name',dp.delivery_name);
  $div.addClass('list-group-item btn btn-default col-sm-3 col-md-2');
  var html = '<h4>'+dp.delivery_name+'</h4>' + '<address>地址：'+dp.address+'</address>' + '<p>联系电话：'+dp.contact+'</p>' + '<p>开业时间：'+dp.open_time+'</p>'+'<p>关门时间：'+dp.close_time+'</p>' + '<p>评分：'+dp.rate+'</p>';
  $div.append(html);
  $div.click(function () {
    query_delivery_point($(this));
  });
  $('#display').append($div);
}

//渲染商品
function render_product(product) {
  var $div = $('<div></div>');
  $div.attr('style',"width:20%;height:350px;");
  $div.addClass('thumbnail col-sm-6 col-md-3');

  var img = '<img class="img-responsive" src="img/' + product.product_name + '.jpg" alt="' + product.product_name + '"/>';

  var content = '<div class="caption">' + '<h3>'+product.product_name+'</h3>' + '<p>类别：'+product.type+'</p>' + '<p>单价：'+product.price+'/'+product.unit+'</p>';

  var $form = $('<div></div>');
  $form.attr('product_name',product.product_name);
  $form.attr('price',product.price);
  $form.addClass('form-inline');
  $form.append('<input class="form-control" min="1" style="width:40%" type="number" name="quantity" value="1">');
  $form.append('<button class="btn btn-primary form-control" type="button">加入购物车</button>');
  $div.append(img,content,$form);
  $('#display').append($div);
}


/*查询业务逻辑*/
//获取行政区信息
function fetch_district(){
  $.get('index_fetch_district',function (data,status) {
    if(status=="success"){
      console.log('获得行政区信息');
      var district_list = JSON.parse(data);
      for (var i in district_list) {
        render_district(district_list[i]);
      }
    }else{
      console.error('无法连接到服务器');
    }
  });
}

//查询指定行政区内的提货点
function query_district(){
  var district_id = $('#query_form [name=district]').val();
  var type = $('#query_form [name=type]').val();
  var options = {
    url:'/index_query_district',
    type:'get',
    data:{'district_id':district_id,'type':type},
    dataType:'json',
    success:function(dp_list) {
      console.log('获得提货点信息答复');
      // dp_list = JSON.parse(dp_list);
      if (dp_list.err){
        console.error('查询提货点信息错误');
        return;
      }
      //成功查询到提货点
      $('#display').empty();
      $('#display').attr('district_id',district_id);

      for (var i in dp_list) {
        render_delivery_point(dp_list[i]);
      }
      $('#display div h4').addClass('list-group-item-heading');
      $('#display div address').addClass('list-group-item-text');
      $('#display div p').addClass('list-group-item-text');
    },
    error:get_error
  };
  $.ajax(options);
}

//查询指定提货点的商品
function query_delivery_point($dp){
  var delivery_name = $dp.attr('delivery_name');
  var district_id = $('#display').attr('district_id');
  var options = {
    url:'/index_query_delivery_point',
    type:'get',
    data:{'delivery_name':delivery_name,'district_id':district_id},
    dataType:'json',
    success:function(product_list,status) {
      console.log('获得商品信息查询回复');
      if (product_list.err){
        console.error('查询商品信息错误');
        return;
      }

      $('#display').empty();
      $('#display').attr('delivery_name',delivery_name);

      for (var i in product_list) {
        render_product(product_list[i]);
      }

      $('#display div button').click(function() {
        user_info = JSON.parse($.cookie('user_info'));
        if (user_info.type!='CUSTOMER') {
          alert('只有普通用户可以添加购物车');
          window.location.href='login.html';
        }
        var product_name = $(this).parent().attr('product_name');
        var quantity = $(this).prev().val();
        var price = $(this).parent().attr('price');
        $(this).prev().val(1);
        add_to_cart(product_name,price,quantity);
      });
    },
    error:get_error
  };
  $.ajax(options);
}

//加入购物车
function add_to_cart(product_name,price,quantity){
  var options = {
    url:'/index_add_to_cart',
    type:'get',
    data:{'district_id':$('#display').attr('district_id'),'delivery_name':$('#display').attr('delivery_name'),'product_name':product_name,'price':price,'quantity':quantity},
    dataType:'text',
    success:function(status) {
      console.log('收到服务器对购物车操作的答复');
      if (status=='success') {
        success('成功加入购物车');
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
  fetch_district(); //获取行政区信息
  $('#query_btn').click(query_district);  //绑定查询按钮
  console.log('主页');
}

$(document).ready(init);
