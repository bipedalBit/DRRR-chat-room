// client variables
var username;
var color;
var simplifiedName;
var connected = false;
var nameOK = false;

// DOM objects
var $window = $(window);
var $audio = $('#audio')[0];

var $loginPage = $('.login.page');
var $usernameInput = $('.usernameInput');
var $passwordInput = $('.passwordInput');
var $inviteCodeLabel = $('.inviteCodeLabel');
var $toChatRoomLabel = $('.toChatRoomLabel');
var $toRegisterLabel = $('.toRegisterLabel');

var $invitePage = $('.invite.page');
var $inviterInput = $('.inviterInput');
var $inviteCodeInput = $('.inviteCodeInput');
var $inviteBtn = $('.invite.clickLabel');

var $registerPage = $('.register.page');
var $usernameRegister = $('.usernameRegister');
var $usernameAvailable = $('.usernameAvailable');
var $passwordRegister = $('.passwordRegister');
var $passwordRequired = $('.passwordRequired');
var $passwordConfirm = $('.passwordConfirm');
var $passwordMatch = $('.passwordMatch');
var $simplifiedName = $('.simplifiedName');
var $colorPicker = $('.color-box');
var $icon = $('#icon');
var $registerBtn = $('.register.btn');

var $chatPage = $('.chat.page');
var $messages = $('.messages');
var $messageInput = $('.messageInput');
var $sendBtn = $('.send.btn');
var $logoutLabel = $('.logoutLabel');

// event slots
var socket = io();

function login(type) {
	if($usernameInput.val().trim() == '' || $passwordInput.val().trim() == '') {
		alert('Username and password can\'t be empty.');
		return false;
	}
	var data = new Object();
	data.username = $usernameInput.val();
	data.password = $passwordInput.val();
	data.type = type;
	socket.emit('login', data);
}

socket.on('login', function (data) {
	if(data.res == 0) {
		username = $usernameInput.val();
		color = data.color;
		simplifiedName = data.simpName;
		connected = true;
		if (data.type == 'toChatRoom') {
			socket.emit('user joined');
			socket.emit('to chat room');
			$loginPage.fadeOut();
			$chatPage.show();
		} else if (data.type == 'inviteCode') {
			socket.emit('invite code');
		}
	} else if(data.res == 1) {
		alert('This user has connected.');
		$usernameInput.val('');
		$passwordInput.val('');
		$usernameInput.focus();
	} else if(data.res == 2) {
		alert('Username or password incorrect.');
		$usernameInput.val('');
		$passwordInput.val('');
		$usernameInput.focus();
	}
});

function strlen(str) {
	var realLen = 0, len = str.length, charCode = -1;
	for (var i = 0; i < len; i++) {
		charCode = str.charCodeAt(i);
		if (charCode >= 0 && charCode <= 128) {
			realLen++;
		} else{
			realLen += 2;
		}
	}
	return realLen;
}

function my_substr(str, len) {
	var l = str.length;
	while (strlen(str.substr(0, l)) > len) {
		l--;
	}
	return str.substr(0, l);
}

function encodeHTML(str) {
	var REGX_HTML_ENCODE = /"|&|'|<|>|[\x00-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g;
	return (typeof str != "string") ? str : str.replace(REGX_HTML_ENCODE, function($0) {
		var c = $0.charCodeAt(0), r = ["&#"];
		c = (c == 0x20) ? 0xA0 : c;
		r.push(c);
		r.push(";");
		return r.join("");
	});
}

function showMessage(data) {
	var icon = '<div class="icon" style="background-color:#'
		+ data.color + '" title="' + data.username + '">' + data.simpName + '</div>';
	var head = '<div class="tag" style="background-color:#'
		+ data.color + '"><div class="arrow"><em style="border-color: transparent #'
		+ data.color + ' transparent transparent;"></em></div>';
	var tail = '</div>';
	$audio.play();
	$messages.append(icon + head + data.message + tail);
	$messages.scrollTop($messages[0].scrollHeight - $messages.height());
};

function clearLoginPage() {
	$usernameInput.val('');
	$passwordInput.val('');
}

function clearInvitePage() {
	$inviterInput.val('');
	$inviteCodeInput.val('');
}

function clearRegisterPage() {
	$usernameRegister.val('');
	$passwordRegister.val('');
	$passwordConfirm.val('');
	$simplifiedName.val('');
	$colorPicker.css('background-color', '#ff8800');
	$colorPicker.attr('title', '#FF8800');
	$icon.css('background-color', '#ff8800');
}

$toChatRoomLabel.click(function () {
	if(connected) {
		socket.emit('user joined');
		socket.emit('to chat room');
		$loginPage.fadeOut();
		$chatPage.show();
	} else{
		login('toChatRoom');
	}
});

$passwordInput.keydown(function (e) {
	if(e.keyCode == 13) {
		$toChatRoomLabel.trigger('click');
	}
});

socket.on('user joined', function (data) {
	var s = (data.userNum > 1) ? 'users' : 'user';
	if (data.self == true) {
		$messages.append('<div class="sysMsg">'
			+ 'Welcome to DRRR Chat Room. '
			+ data.userNum + ' ' + s + ' online.</div>'
		);
		return;
	}
	$messages.append('<div class="sysMsg">'
		+ data.username + ' connected. '
		+ data.userNum + ' ' + s + ' online.</div>'
	);
});

socket.on('user left', function (data) {
	var s = (data.userNum > 1) ? 'users' : 'user';
	$messages.append('<div class="sysMsg">'
		+ data.username + ' disconnected. '
		+ data.userNum + ' ' + s + ' online.</div>'
	);
});

$inviteCodeLabel.click(function () {
	if(connected) {
		socket.emit('invite code');
	} else{
		login('inviteCode');
	}
});

socket.on('invite code', function (code) {
	$inviteCodeLabel.text(code);
});

$toRegisterLabel.click(function () {
	$loginPage.fadeOut();
	clearInvitePage();
	$invitePage.show();
	$inviterInput.focus();
});

$inviteBtn.click(function () {
	if($inviterInput.val().trim() == '' || $inviteCodeInput.val().trim() == '') {
		alert('Inviter and invite code can\'t be empty.');
		return;
	}
	var data = new Object();
	data.inviter = $inviterInput.val();
	data.code = $inviteCodeInput.val().toUpperCase();
	socket.emit('invite validate', data);
});

socket.on('invite validate', function (res) {
	if (res) {
		$invitePage.fadeOut();
		clearRegisterPage();
		$registerPage.show();
		$usernameRegister.focus();
		return;
	} else{
		alert('Username or invite code incorrect.');
		return;
	};
});

$inviteCodeInput.keydown(function (e) {
	if(e.keyCode == 13) {
		$inviteBtn.trigger('click');
	}
});

$usernameRegister.blur(function () {
	if ($usernameRegister.val().trim() == '') {
		$usernameAvailable.html('Username can\'t be empty.');
	} else{
		$usernameRegister.val(my_substr($usernameRegister.val(), 20));
		socket.emit('name check', $usernameRegister.val());
	};
});

socket.on('name check', function (res) {
	if(res == true) {
		nameOK = true;
		$usernameAvailable.html('<img src="image/ok.png"/>');
		return;
	} else{
		nameOK = false;
		$usernameAvailable.html('Username has been ocuppied.');
		return;
	}
});

$passwordRegister.blur(function () {
	if ($passwordRegister.val().trim() == '') {
		$passwordRequired.html('Password can\'t be empty.');
	} else{
		$passwordRequired.html('<img src="image/ok.png"/>');
		if ($passwordRegister.val() == $passwordConfirm.val()) {
			$passwordMatch.html('<img src="image/ok.png"/>');
		}
	}
});

$passwordConfirm.blur(function () {
	if ($passwordConfirm.val().trim() == '') {
		$passwordMatch.html('Password must be confirmed.');
	} else if($passwordRegister.val() != $passwordConfirm.val()){
		$passwordMatch.html('Two times of password input not match.');
	} else{
		$passwordMatch.html('<img src="image/ok.png"/>');
	}
});

$simplifiedName.blur(function () {
	$simplifiedName.val(my_substr($simplifiedName.val(), 2));
	$icon.text($simplifiedName.val());
});

$colorPicker.click(function () {
	$colorPicker.colpick({
		colorScheme:'dark',
		layout:'rgbhex',
		color:'ff8800',
		onSubmit:function(hsb,hex,rgb,el) {
			$(el).css('background-color', '#'+hex);
			$(el).colpickHide();
			$icon.css('background-color', '#'+hex);
			$colorPicker.attr('title', '#'+hex);
		}
	});
});

$registerBtn.click(function () {
	if (
		$usernameRegister.val().trim() == '' ||
		!nameOK ||
		$passwordRegister.val().trim() == '' ||
		$passwordConfirm.val().trim() == ''||
		$passwordRegister.val().trim() != $passwordConfirm.val().trim() ||
		$simplifiedName.val().trim() == ''
	) {
		alert('Something wrong ハ(#゜Д゜)(゜Д゜メ)ァ?!');
		return false;
	}
	var data = new Object();
	data.username = $usernameRegister.val();
	data.password = $passwordRegister.val();
	data.color = $colorPicker.attr('title').substr(1);
	data.simpName = $simplifiedName.val();
	socket.emit('register', data);
	location.reload();
});

$sendBtn.click(function () {
	if ($messageInput.val() == '') {
		return false;
	}
	var data = new Object();
	data.username = username;
	data.simpName = simplifiedName;
	data.color = color;
	data.message = encodeHTML($messageInput.val());
	socket.emit('new message', data.message);
	showMessage(data);
	$messageInput.val('');
});

$messageInput.keydown(function (e) {
	if(e.keyCode == 13) {
		$sendBtn.trigger('click');
	}
});

socket.on('new message', function (data) {
	showMessage(data);
});

$logoutLabel.click(function () {
	clearLoginPage();
	location.reload();
});