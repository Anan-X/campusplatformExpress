
 //产生一个hash值，只有数字，规则和java的hashcode规则相同
function hashCode(str) {
	var h = 0;
	var len = str.length;
	var t = 2147483648;
	for (var i = 0; i < len; i++) {
			h = 31 * h + str.charCodeAt(i);
			if (h > 2147483647) h %= t; //java int溢出则取模
	}
	/*var t = -2147483648 * 2;
	 while (h > 2147483647) {
	 h += t
	 }*/
	return h;
}

//时间戳来自客户端，精确到毫秒，但仍旧有可能在在多线程下有并发，
//尤其hash化后，毫秒数前面的几位都不变化，导致不同日期hash化的值有可能存在相同，
//因此使用下面的随机数函数，在时间戳上加随机数，保证hash化的结果差异会比较大
/*
** randomWord 产生任意长度随机字母数字组合
** randomFlag-是否任意长度 min-任意长度最小位[固定位数] max-任意长度最大位
** 用法  randomWord(false,6);规定位数 flash
*      randomWord(true,3，6);长度不定，true
* arr变量可以把其他字符加入，如以后需要小写字母，直接加入即可
*/
function randomWord(randomFlag, min, max) {
	var str = "",
			range = min,
			arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
	// 随机产生
	if (randomFlag) {
			range = Math.round(Math.random() * (max - min)) + min;
	}
	for (var i = 0; i < range; i++) {
			let pos = Math.round(Math.random() * (arr.length - 1));
			str += arr[pos];
	}
	return str;
}
//获取hashcode
exports.gethashcode = function () {
	//定义一个时间戳，计算与1970年相差的毫秒数  用来获得唯一时间
	var timestamp = (new Date()).valueOf();
	var myRandom=randomWord(false,6);
	var hashcode=hashCode(myRandom+timestamp.toString());
	return hashcode;
}