
// make functions called in assigned scope
// which means binding 'this' variable 
// when function is called
function bind(func, scope){
	return function(){
		return func.apply(scope, arguments);
	};
}
// deap copy a object
function clone(obj){
	if(obj == null || typeof(obj) != 'object')
		return obj;

	var temp = {};
	//var temp = obj.constructor(); // changed

	for(var key in obj)
		temp[key] = clone(obj[key]);
	return temp;
}

// sum up some prop in an array of objects
function sumByProp(arr, prop) {
	return arr.map(function(k) {
		return k[prop];
	}).reduce(function(a, b) {
		return a + b;
	});
}

// sum up some prop in an array of objects
function sumByFunc(arr, func) {
	return arr.map(function(k) {
		return func(k);
	}).reduce(function(a, b) {
		return a + b;
	});
}

// sort an object array by it's property
function sortByProp(arr, prop, order) {
	return arr.sort(function(a, b) {
		return order * (a[prop] - b[prop]);
	});
}

//Schwartzian transform
function sortByFunc(arr, func, order) {
	return arr.map(function (x) {
		return [x, func(x)];
	}).sort(function (a, b) {
		return order * (a[1] - b[1]);
	}).map(function (x) {
		return x[0];
	});
}

function lot(arr, func, total_prob) {
	if (totla_prop == null) {
		total_prob = sumByFunc(arr, func);
	}
	var r = rand(1, total_prob); // 1 ~ total_prob
	for (var i = 0; i < arr.length; i++) {
		rand -= func(arr);
		if (rand < 0) {
			return arr[i];
		}	
	}
}

// return random integers in [min, max];
function rand(min, max) {
	return Math.floor((Math.random() * (max - min + 1)) + min);
}

// get url parameter
function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function isSmartPhone () {
	return (navigator.userAgent.indexOf('iPhone') != -1 ||
			navigator.userAgent.indexOf('Android') != -1);
}


