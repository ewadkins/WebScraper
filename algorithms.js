
module.exports = {
		binarySearch: binarySearch,
		binaryInsert: binaryInsert,
		mergeSort: mergeSort
};

function binarySearch(A, x) {
	var low = 0;
	var high = A.length - 1;
	var mid;
	while (low <= high) {
		mid = low + ((high - low) >> 1);
		if (x === A[mid]) {
			return mid;
		}
		else if (x > A[mid]) {
			low = mid + 1;
		}
		else {
			high = mid - 1;
		}
	}
	return null;
}

function binaryInsert(A, x) {
	if (A.length === 0) {
		return [x];
	}
	if (x <= A[0]) {
		A.splice(0, 0, x);
		return A;
	}
	if (x > A[A.length - 1]) {
		A.push(x);
		return A;
	}
	var low = 0;
	var high = A.length - 1;
	var mid;
	while (low <= high) {
		mid = low + ((high - low) >> 1);
		if (x === A[mid]) {
			A.splice(mid, 0, x);
			return A;
		}
		else if (x > A[mid]) {
			low = mid + 1;
		}
		else {
			high = mid - 1;
		}
	}
	if (x <= A[low]) {
		A.splice(low, 0, x);
	}
	else {
		A.splice(low + 1, 0, x);
	}
	return A;
}

function mergeSort(A) {
	if (A.length <= 1) {
		return A;
	}
	var mid = A.length >> 1;
	var left = new Array(mid);
	var right = new Array(A.length - mid);
	for (var i = 0; i < mid; i++) {
		left[i] = A[i];
	}
	for (var i = mid; i < A.length; i++) {
		right[i - mid] = A[i];
	}
	left = mergeSort(left);
	right = mergeSort(right);
	var result = new Array(A.length);
	var l = 0;
	var r = 0;
	while (l < left.length && r < right.length) {
		if (left[l] <= right[r]) {
			result[l + r] = left[l];
			l++;
		}
		else {
			result[l + r] = right[r];
			r++;
		}
	}
	while (l < left.length) {
		result[l + r] = left[l];
		l++;
	}
	while (r < right.length) {
		result[l + r] = right[r];
		r++;
	}
	return result;
}

function isEqual (a, b) {
	var caseSensitive = false;
	// Undefined
	if (a === undefined || b === undefined) {
		return a === b;
	}
	// Null
	else if (a === null || b === null) {
		return a === b;
	}
	// String
	else if (typeof a === 'string' || typeof b === 'string') {
		if (typeof a === 'string' && typeof b === 'string') {
			if (!caseSensitive) {
				return a.toLowerCase() === b.toLowerCase();
			}
		}
		return a === b;
	}
	// Number
	else if (typeof a === 'number' || typeof b === 'number') {
		return a === b;
	}
	// Date
	else if (a instanceof Date || b instanceof Date) {
		return a === b;
	}
	// Array
	else if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) {
			return false;
		}
		for (var i = 0; i < a.length; i++) {
			if (!isEqual(a[i], b[i])) {
				return false;
			}
		}
		return true;
	}
	// Object
	else if (a instanceof Object && !Array.isArray(a) && b instanceof Object && !Array.isArray(b)) {
		for (var key in a) {
			if (a.hasOwnProperty(key)) {
				if (!isEqual(a[key], b[key])) {
					return false;
				}
			}
		}
		for (key in b) {
			if (b.hasOwnProperty(key)) {
				if (!isEqual(a[key], b[key])) {
					return false;
				}
			}
		}
		return true;
	}
	return false;
}
