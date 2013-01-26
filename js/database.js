var indexedDB = window.indexedDB ||
		window.webkitIndexedDB ||
		window.mozIndexedDB;

if (window.mozIndexedDB) {
	window.indexedDB = window.mozIndexedDB;
	window.IDBKeyRange = window.IDBKeyRange;
	window.IDBTransaction = window.IDBTransaction;
}
if (window.webkitIndexedDB) {
	window.indexedDB = window.webkitIndexedDB;
	window.IDBKeyRange = window.webkitIDBKeyRange;
	window.IDBTransaction = window.webkitIDBTransaction;
}

webca.DBInterface = function () {
	this.db = null;
	this.version = "3";
}

webca.DBInterface.prototype = {
	connect: function (callback) {
		var request = indexedDB.open("webcalcium");

		function setSchema(e) {
			var store = this.db.createObjectStore("events", {keyPath: "id", autoIncrement: true});
			store.createIndex("eventtimestamp", "eventtimestamp", {unique: false});
			store.createIndex("addedtimestamp", "addedtimestamp", {unique: false});
			store.createIndex("tags", "tags", {unique: false, multiEntry: true});

		}

		request.onsuccess = function (e) {
			this.db = e.target.result;
			if (this.version != this.db.version && this.db.setVersion) {
				var setVersionRequest = this.db.setVersion(this.version);

				setVersionRequest.onsuccess = function () {
					setSchema.bind(this)();
					if (callback) callback();
				}.bind(this);
			} else {
				if (callback) callback();
			}
		}.bind(this);

		request.onupgradeneeded = function (e) {
			this.db = e.target.result;
			setSchema.bind(this)();
		}.bind(this);
	},

	addEvent: function (subject, contents, eventtimestamp, tags, callback) {
		var tags = this._parseTags(tags);
		var addedtimestamp = new Date().getTime();

		var transaction = this.db.transaction(["events"], (window.webkitIDBTransaction != undefined) ? window.webkitIDBTransaction.READ_WRITE : "readwrite");
		var store = transaction.objectStore("events");
		var request = store.put({
			subject: subject,
			contents: contents,
			eventtimestamp: eventtimestamp,
			addedtimestamp: new Date().getTime(),
			tags: tags
		});

		request.onsuccess = function (e) {
			callback();
			toastr.success("The event has been added.", "Success");
		};

		request.onerror = function (e) {
			toastr.error("An unknown error has occurred. Please, reload the page and try again", "Unknown error");
		}
	},

	updateEvent: function (id, subject, contents, eventtimestamp, tags, callback) {
		var tags = this._parseTags(tags);
		var addedtimestamp = new Date().getTime();

		var transaction = this.db.transaction(["events"], (window.webkitIDBTransaction != undefined) ? window.webkitIDBTransaction.READ_WRITE : "readwrite");
		var store = transaction.objectStore("events");
		var request = store.put({
			id: id,
			subject: subject,
			contents: contents,
			eventtimestamp: eventtimestamp,
			addedtimestamp: new Date().getTime(),
			tags: tags
		});

		request.onsuccess = function (e) {
			callback();
		}
		request.onerror = function (e) {
			toastr.error("An unknown error has occurred. Please, reload the page and try again", "Unknown error");
		}
	},

	getEvent: function (id, callback) {
		var transaction = this.db.transaction(["events"], (window.webkitIDBTransaction != undefined) ? window.webkitIDBTransaction.READ_WRITE : "readwrite");
		var store = transaction.objectStore("events");

		var req = store.get(id);

		req.onsuccess = function (e) {
			callback(req.result);
		}
	},

	changePositions: function (source, target, callback) {
		var src = parseInt(source);
		var tar = parseInt(target);

		var db = this.db;
		var obj = this;

		var srcev = this.getEvent(src, function (data) {
			var srctimestamp = data.addedtimestamp;

			var tarev = obj.getEvent(tar, function (dat) {
				var tartimestamp = dat.addedtimestamp;

				var transaction = db.transaction(["events"], (window.webkitIDBTransaction != undefined) ? window.webkitIDBTransaction.READ_WRITE : "readwrite");
				var store = transaction.objectStore("events");
				var request = store.put({
					id: src,
					subject: data.subject,
					contents: data.contents,
					eventtimestamp: data.eventtimestamp,
					addedtimestamp: tartimestamp,
					tags: data.tags
				});

				request.onsuccess = function () {
					var transaction = db.transaction(["events"], (window.webkitIDBTransaction != undefined) ? window.webkitIDBTransaction.READ_WRITE : "readwrite");
					var store = transaction.objectStore("events");
					var request = store.put({
						id: tar,
						subject: dat.subject,
						contents: dat.contents,
						eventtimestamp: dat.eventtimestamp,
						addedtimestamp: srctimestamp,
						tags: dat.tags
					});

					request.onsuccess = function () {
						callback();
					}
				}
			});
		});
	},

	getEvents: function (callback) {
		var transaction = this.db.transaction(["events"], (window.webkitIDBTransaction != undefined) ? window.webkitIDBTransaction.READ_WRITE : "readwrite");
		var store = transaction.objectStore("events");

		var keyRange = IDBKeyRange.lowerBound(0);
		var cursorRequest = store.openCursor(keyRange);
		var list = [];
		cursorRequest.onsuccess = function (e) {
			var result = e.target.result;
			if (!!result == false) {
				list.sort(function(a,b){return a.addedtimestamp-b.addedtimestamp});
				if (callback) callback(list);
			} else {
				list.push(result.value);
				result["continue"](); // Scumbag Android browser complains about a syntax error.
			}
		}
		cursorRequest.onerror = function (e) {
			toastr.error("An unknown error has occurred. Please, reload the page and try again", "Unknown error");
		}
	},

	filterEvents: function (fulltext, tag, range, callback) {
		var transaction = this.db.transaction(["events"], (window.webkitIDBTransaction != undefined) ? window.webkitIDBTransaction.READ_WRITE : "readwrite");
		var store = transaction.objectStore("events");

		var cursorRequest;
		if (tag) cursorRequest = store.index("tags").openCursor(IDBKeyRange.only(tag));
		else cursorRequest = store.openCursor();

		var list = [];
		cursorRequest.onsuccess = function (e) {
			var result = e.target.result;
			if (!!result == false) {
				if (callback) callback(list);
			} else {
				if ((!range.length) || ((result.value.eventtimestamp >= range[0]) && (result.value.eventtimestamp <= range[1]))) {
					if ((!fulltext) || ((result.value.subject.toLowerCase().indexOf(fulltext.toLowerCase()) != -1) || (result.value.contents.toLowerCase().indexOf(fulltext.toLowerCase()) != -1))) {
						list[list.length] = result.value;
					}
				}
				result["continue"]();
			}
		}
		cursorRequest.onerror = function (e) {
			toastr.error("An unknown error has occurred. Please, reload the page and try again", "Unknown error");
		}
	},

	removeEvent: function (id, callback) {
		var transaction = this.db.transaction(["events"], "readwrite");
		var store = transaction.objectStore("events");

		var request = store["delete"](id); // Same as continue, damnit, Android browser.

		request.onsuccess = function (e) {
			callback();
		};
		request.onerror = function (e) {
			toastr.error("An unknown error has occurred. Please, reload the page and try again", "Unknown error");
		}

	},

	_parseTags: function (tags) {
		var out = [];
		for (var i=0; i<tags.length; i++) {
			var t = tags[i].replace(/^\s*/, '').replace(/\s*$/, '');
			if (t != "") {
				out[out.length] = t;
			}
		}
		return out;
	}
}