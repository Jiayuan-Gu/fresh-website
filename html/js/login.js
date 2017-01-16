function check_password() {
  password = $("#register_form [name='password']").val();
  password2 = $("#register_form [name='password2']").val();
  return password == password2;
}

// 页面初始化
function init(){
  $.removeCookie('user_info');
  render_header();  //渲染导航栏
  $('#register_btn').click(function() {
    if(check_password()){
      $('#register_form').submit();
    }else {
      alert('确认密码不正确');
    }
  });
  console.log('登录界面');
}

$(document).ready(init);
