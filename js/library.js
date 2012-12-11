// Some utility functions

Element.prototype.addClass = function (cls) {
	$(this).addClass(cls);
}

Element.prototype.removeClass = function (cls) {
	$(this).removeClass(cls);
}

Element.prototype.hasClass = function (cls) {
	return $(this).hasClass(cls);
}

// Shim for older browsers
if (!Function.prototype.bind) {
	Function.prototype.bind = function (oThis) {
		var aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP = function () {},
			fBound = function () {
				return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
			};

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
}

webca = {};

webca.Interface = function () {
	this.element = document.createElement("div");

	this.toolbar = document.createElement("ul");
	this.toolbar.addClass("nav");
	this.toolbar.id = "nav";
	this.element.appendChild(this.toolbar);

	this.view = document.createElement("div");
	this.element.appendChild(this.view);

	this.menus = [];

	this.done = false;
};

webca.Interface.prototype = {
	addMenu: function (menu) {
		this.toolbar.appendChild(menu.element);
		this.menus[this.menus.length] = menu;

		if (menu.view && menu.view.element) {
			this.view.appendChild(menu.view.element);
			menu.view.element.style.display = "none";
		}

		var cls = this;

		if (menu.callback) menu.element.addEventListener("click", function () {
			this.that.openMenu(this.i);
		}.bind({that: this, i: this.menus.length-1}));

		if (menu.path == path) {
			this.openMenu(this.menus.length-1);
		}
	},

	openMenu: function (j) {
		for (var i=0; i<this.menus.length; i++) {
			if (!this.menus[i].view) continue;
			if (i === j) {
				if (this.menus[i].view.element) this.menus[i].view.element.style.display = "block";
				this.menus[i].element.addClass("active");
				if (this.menus[i].view.onActivate) this.menus[i].view.onActivate();
				if (history.pushState && !this.done) {
					history.pushState({path: this.menus[i].path}, this.menus[i].name, this.menus[i].path);
				} else {
					this.done = true;
				}
				if (i != 0 && this.menus.length === 5) { this.menus[4].element.removeClass("doshow"); }
			} else {
				if (this.menus[i].view.element) {
					this.menus[i].view.element.style.display = "none";
				}
				this.menus[i].element.removeClass("active");
			}
		}
	},

	onLoad: function () {
		window.onpopstate = function (ev) { // Handles back button (History API)
			var state = ev.state;
			if (!state) state = {path: path};
			for (var i=0; i<this.menus.length; i++) {
				if (!this.menus[i].view) continue;
				if (this.menus[i].path == state.path) {
					this.menus[i].element.addClass("active");
					if (this.menus[i].view.element) this.menus[i].view.element.style.display = "block";
				} else {
					if (this.menus[i].view.element) this.menus[i].view.element.style.display = "none";
					this.menus[i].element.removeClass("active");
				}
			}
		}.bind(this);
	}
}

webca.Menu = function (options) {
	this.name = options.name || "";
	this.end = options.end || false;
	this.view = options.view || null;
	this.path = options.path || "";
	this.callback = (options.callback != undefined) ? options.callback : true;

	this.element = document.createElement("li");
	if (this.end) this.element.addClass("end");

	if (options.img) {
		var img = document.createElement("span");
		img.className = "img-"+options.img+" "+"icon-image";
		this.element.appendChild(img);
	}

	var label = document.createElement("span");
	label.addClass("icon-text");

	var a = document.createElement("a");
	a.href = this.path;
	a.appendChild(document.createTextNode(this.name));
	a.addEventListener('click', function (e) {
		e.preventDefault();
		return false;
	})
	label.appendChild(a);

	this.element.appendChild(label);
};