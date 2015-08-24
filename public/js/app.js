var cchat = cchat || {};

cchat.config = (function  () {

	var encryptionConfig = {};
	var onLoadCallback;

	function changeEncryptionConfig(e) {
		var fileInput = e.target;
		var configFile = fileInput.files[0];
		var reader = new FileReader();
		reader.addEventListener('load', function readEncryptConfig(readEventData) {
			encryptionConfig.userData = JSON.parse(readEventData.target.result);
			if (onLoadCallback) {
				onLoadCallback();
			}
		}, false);

		reader.readAsText(configFile);
	}

	var configFileInputElems = document.querySelectorAll('.encryption-config-file');

	for (var i = configFileInputElems.length - 1; i >= 0; i--) {
		configFileInputElems[i].addEventListener('change', changeEncryptionConfig, false);
	}

	return {
		onload: function (callback) {
			onLoadCallback = callback;
		},
		get: {
			all: function () {
				return encryptionConfig.userData;
			},
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

}());