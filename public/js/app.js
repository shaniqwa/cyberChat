var cchat = cchat || {};

cchat.config = (function  () {

	var encryptionConfig = {};
	var configObject = {};
	var onloadCallback;

	function changeEncryptionConfig(e) {
		var fileInput = e.target;
		var configFile = fileInput.files[0];
		var reader = new FileReader();
		reader.addEventListener('load', function readEncryptConfig(readEventData) {
			encryptionConfig.userData = JSON.parse(readEventData.target.result);
			if (onloadCallback) {
				onloadCallback();
			}
		}, false);

		reader.readAsText(configFile);
	}

	var configFileInputElems = document.querySelectorAll('.encryption-config-file');

	for (var i = configFileInputElems.length - 1; i >= 0; i--) {
		configFileInputElems[i].addEventListener('change', changeEncryptionConfig, false);
	};


	var configObj = {
		onload: function (callback) {
			onloadCallback = callback;
		},
		get: {
			encryption: {
				alg: function (defaultAlgorithm) {
					return encryptionConfig.userData.encryption.alg || defaultAlgorithm;
				},
				key: function () {
					var fileKey = encryptionConfig.userData.encryption.key;
					if (fileKey !== '*') {
						return fileKey.value;
					}
					return fileKey;
				}
			},
			checksum: {
				alg: function (defaultAlgorithm) {
					return encryptionConfig.userData.checksum.alg || defaultAlgorithm;
				}, 
				key: function () {
					var fileKey = encryptionConfig.userData.checksum.key;
					if (fileKey !== '*') {
						return fileKey.value;
					}
					return fileKey;	
				}
			}
		}
	};

	return configObj;

}());