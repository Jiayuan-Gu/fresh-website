// 渲染用户项
function render_user(user) {
  $trow = $('<tr></tr>');
  content = '<td>'+user.username+'</td><td>'+user.type+'</td>';
  $trow.append(content);
  $td = $('<td></td>');
  $td.addClass("form-inline");
  $button = $('<button></button>');
  $button.addClass("btn btn-danger form-control");
  $button.text("删除");
  $button.click(function () {
    remove_user($(this));
  });
  $trow.append($td);
  $trow.attr('username',user.username);
  $td.append($button);
  $('#user_display').append($trow);
}

// 渲染提货点
function render_dp(dp) {
  $trow = $('<tr></tr>');
  content = '<td>'+dp.delivery_name+'</td><td>'+dp.address+'</td><td>'+dp.district_name+'</td><td>'+dp.contact+'</td><td>'+dp.open_time+'</td><td>'+dp.close_time+'</td><td>'+dp.rate+'</td>';
  $trow.append(content);
  $td = $('<td></td>');
  $td.addClass("form-inline");
  $button = $('<button></button>');
  $button.addClass("btn btn-danger form-control");
  $button.text("删除");
  $button.click(function () {
    remove_dp($(this));
  });
  $trow.append($td);
  $trow.attr('delivery_name',dp.delivery_name);
  $trow.attr('district_id',dp.district_id);
  $td.append($button);
  $('#dp_display').append($trow);
}

//获取用户信息
function fetch_user(){
  $.get('management_fetch_user',function (data,status) {
    if(status=="success"){
      console.log('收到获取用户信息回应');
      var user_list = JSON.parse(data);
      if (user_list.error){
        console.error('获取用户信息错误');
        return;
      }
      $('#user_display').empty();
      for (var i in user_list) {
        render_user(user_list[i]);
      }
    }else{
      console.error('无法连接到服务器');
    }
  });
}

//获取提货点信息
function fetch_dp(){
  $.get('management_fetch_dp',function (data,status) {
    if(status=="success"){
      console.log('获得提货点信息回应');
      var dp_list = JSON.parse(data);
      if (dp_list.error){
        console.error('获取提货点信息错误');
        return;
      }
      $('#dp_display').empty();
      for (var i in dp_list) {
        render_dp(dp_list[i]);
      }
    }else{
      console.error('无法连接到服务器');
    }
  });
}

//移除用户信息
function remove_user($button) {
  $trow = $button.parent().parent();
  var username = $trow.attr('username');
  var options = {
    url:'/management_remove_user',
    type:'get',
    data:{'username':username},
    dataType:'text',
    success:function(status) {
      console.log('获得服务器关于删除用户的响应');
      if (status == "success"){
        success('成功删除用户');
        $trow.remove();
      }else{
        failure('未成功删除用户');
      }
    },
    error:get_error
  };
  $.ajax(options);
}

//移除提货点信息
function remove_dp($button) {
  $trow = $button.parent().parent();
  var delivery_name = $trow.attr('delivery_name');
  var district_id = $trow.attr('district_id');
  var options = {
    url:'/management_remove_dp',
    type:'get',
    data:{'delivery_name':delivery_name,'district_id':district_id},
    dataType:'text',
    success:function(status) {
      console.log('获得服务器关于删除提货点的响应');
      if (status == "success"){
        success('成功删除提货点');
        $trow.remove();
      }else{
        failure('未成功删除提货点');
      }
    },
    error:get_error
  };
  $.ajax(options);
}

//提交增加用户请求
function add_user(){
  var username = $('#add_user_form [name=username]').val();
  var password = $('#add_user_form [name=password]').val();
  var password2 = $('#add_user_form [name=password2]').val();
  // var nickname = $('#add_user_form [name=nickname]').val();
  // var contact = $('#add_user_form [name=contact]').val();
  // var sex = $('#add_user_form [name=sex]').val();
  // var type = $('#add_user_form [name=type]').val();

  if(password!=password2){
    alert('请确认密码');
    return false;
  }
  if(username==""||password==""){
    alert('请补充完整信息');
    return false;
  }
  $('#add_user_form').submit();
  // var options = {
  //   url:'/management_add_user',
  //   type:'get',
  //   data:{'username':username,'password':password,'nickname':nickname,'contact':contact,'sex':sex,'type':type},
  //   dataType:'text',
  //   success:function(status) {
  //     if (status!="success"){
  //       console.error('增加用户错误');
  //       return;
  //     }
  //     fetch_user();
  //   },
  //   error:get_error
  // };
  // $.ajax(options);
}

//提交增加提货点请求
function add_dp(){
  var delivery_name = $('#add_user_form [name=delivery_name]').val();
  var address = $('#add_user_form [name=address]').val();
  var district_name = $('#add_user_form [name=district_name]').val();
  // var nickname = $('#add_user_form [name=nickname]').val();
  // var contact = $('#add_user_form [name=contact]').val();
  // var sex = $('#add_user_form [name=sex]').val();
  // var type = $('#add_user_form [name=type]').val();

  if(delivery_name==""||address==""){
    alert('请补充完整信息');
    return false;
  }
  $('#add_dp_form').submit();
}

// 页面初始化
function init(){
  render_header();  //渲染导航栏
  fetch_user();
  fetch_dp();
  $('#add_user_btn').click(add_user);
  $('#add_dp_btn').click(add_dp);
  console.log('用户管理界面');
}

$(document).ready(init);
