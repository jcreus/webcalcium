webca.Event = function (text, eventview, n) {
	this.element = document.createElement("div");
	this.element.className = "event-all";
	this.element.addEventListener("click", function () {
		eventview.setEventFromEvent(n);
	})

	this.eventview = eventview;

	this.main = document.createElement("div");
	this.main.className = "event-text-container"
	this.element.appendChild(this.main);

	var _Date;
	var _DateInput;
	var data;
	var realtags;
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	this.date = document.createElement("div");
	this.date.className = "event-text event-date";
	date = new Date(text.eventtimestamp);

	if (text.eventtimestamp) {
	var _date = document.createElement("span");
	_date.appendChild(document.createTextNode(months[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear()));
	this.date.appendChild(_date);
	} else {
		this.date.style.display = "none";
	}

	_Date = document.createElement("input");
	_Date.style.display = "none";
	_Date.placeholder = "Date";
	if (text.eventtimestamp) _Date.value = (date.getMonth()+1)+"/"+date.getDate()+"/"+date.getFullYear();

	this.date.appendChild(_Date);
	this.main.appendChild(this.date);

	this.tags = document.createElement("div");
	this.tags.className = "event-text event-tags";
	if (text.tags.length != 0 && !(text.tags.length == 1 && text.tags[0] == "")) {
		realtags = document.createElement("span");
		for (var i=0; i<text.tags.length; i++) {
			var tag = document.createElement("span");
			tag.className = "event-tag";
			tag.appendChild(document.createTextNode(text.tags[i]));
			realtags.appendChild(tag);
		}
		this.tags.appendChild(realtags);
	} else {
		this.tags.style.display = "none";
	}
	var Tags = document.createElement("input");
	Tags.style.display = "none";
	Tags.value = text.tags.join(',');
	Tags.placeholder = "Tags";
	this.tags.appendChild(Tags);
	this.main.appendChild(this.tags);

	this.submain = document.createElement("div");
	this.submain.className = "event-text";
	var subject = document.createElement("b");
	subject.className = "event-subject";
	subject.appendChild(document.createTextNode(text.subject));
	this.submain.appendChild(subject);
	var Subject = document.createElement("input");
	Subject.style.display = "none";
	Subject.value = text.subject;
	this.submain.appendChild(Subject);

	var contents = document.createElement("div");
	contents.className = "event-contents";
	contents.innerHTML = text.contents.replace(/\n/g, "<br>");
	this.submain.appendChild(contents);

	var Contents = document.createElement("textarea");
	Contents.style.marginTop = "5px";
	Contents.style.width = "80%";
	Contents.style.display = "none";
	Contents.appendChild(document.createTextNode(text.contents));
	this.submain.appendChild(Contents);
	this.main.appendChild(this.submain);

	this.opts = document.createElement("ul");
	this.opts.className = "event-opts";
	this.element.appendChild(this.opts);

	function OptionButton(options) {
		this.name = options.name || "";

		this.element = document.createElement("li");

		if (options.img) {
			this.img = document.createElement("img");
			this.img.src = options.img;
			this.element.appendChild(this.img);
		}

		this.element.addEventListener("click", function () {
			if (options.callback) options.callback(this);
		}.bind(this));

		this.text = document.createTextNode(this.name);
		this.element.appendChild(this.text);
	}

	var buttons = [
		new OptionButton({name: "Edit", img: "img/edit.svg", callback: function (button) {
			if (button.editing) {
				var d = _DateInput.getSelectedAsDates()[0];
				var time = 0;
				if (d) {
					time = d.getTime();
				}
				eventview.intf.updateEvent(text.id, Subject.value, Contents.value, time, Tags.value.split(","), function () {
					eventview.panelview.dashboard.update(function () {
						eventview.panelview.activate(null, null, text.id);
					});
				});
			} else {
				button.editing = true;
				button.text.nodeValue = "Save";
				button.img.src = "img/save.svg";
				subject.style.display = "none";
				Subject.style.display = "block";
				contents.style.display = "none";
				Contents.style.display = "block";
				_DateInput = new Kalendae.Input(_Date);
				_Date.style.display = "block";
				if (_date) _date.style.display = "none";
				this.date.style.display = "inline-block";
				Tags.style.display = "block";
				if (realtags) realtags.style.display = "none";
				this.tags.style.display = "inline-block";
			}
		}.bind(this)}),
		new OptionButton({name: "Delete", img: "img/delete.svg", callback: function (button) {
			var intf = eventview.intf;
			intf.removeEvent(text.id, function () {
				eventview.panelview.dashboard.update();
			});
		}})
	];

	this.onQuit = function () {
		buttons[0].editing = false;
		buttons[0].text.nodeValue = "Edit";
		buttons[0].img.src = "img/edit.svg";
		subject.style.display = "block";
		Subject.style.display = "none";
		contents.style.display = "block";
		Contents.style.display = "none";
		if (_date) _date.style.display = "block";
		_Date.style.display = "none";
		if (!_date) this.date.style.display = "none";
		if (realtags) realtags.style.display = "block";
		Tags.style.display = "none";
		if (!realtags) this.tags.style.display = "none";
	}

	for (var i=0; i<buttons.length; i++) {
		this.opts.appendChild(buttons[i].element);
	}
}

webca.Event.prototype = {
	activate: function () {
		$(this.opts).slideDown(400, function () {
			$(this.eventview.element).animate({
				scrollTop: this.element.offsetTop-document.getElementById("nav").offsetHeight
			}, 500);
		}.bind(this));
		$(this.element).addClass("active");
	},

	deactivate: function () {
		$(this.opts).slideUp(400, function () {
			$(this).hide();
		});
		$(this.element).removeClass("active");
		this.onQuit();
	}
}

webca.EventView = function (panelview, intf, ui) {
	this.panelview = panelview;
	this.intf = intf;
	this.ui = ui;

	this.element = document.createElement("div");
	this.element.className = "main-panel";
	this.element.id = "mainpanel";

	this.events = [];
}

webca.EventView.prototype = {
	setEvent: function (n) {
		for (var i=0; i<this.events.length; i++) {
			if (n == i) {
				this.events[i].activate();
			} else {
				this.events[i].deactivate();
			}
		}
	},

	setEventFromEvent: function (n) {
		this.panelview.activate(null, n);
	},

	setData: function (data) {
		this.element.innerHTML = "";
		this.element.style.background = "transparent";

		this.events = [];
		for (var i=0; i<data.length; i++) {
			var ev = new webca.Event(data[i], this, i);
			this.element.appendChild(ev.element);
			this.events[this.events.length] = ev;
		}

		if (data.length == 0) {
			this.element.style.background = "#BDB2D3";
			this.element.innerHTML = '<div style="margin:15px;color:#220F48"><h2>No events found</h2><p>To add an event, click the "Add event" button in the toolbar above.</div>';
		}

		var div = document.createElement("div");
		div.style.minHeight = "1000px";
		div.innerHTML = "&nbsp;";
		this.element.appendChild(div);
	}
}

webca.PanelView = function (intf, dashboard, ui) {
	this.intf = intf;
	this.data = null;
	this.ui = ui;
	this.dashboard = dashboard;
	this.element = document.createElement("div");
	this.element.id = "main";

	this.lateral = document.createElement("ul");
	this.lateral.addClass("lateral-panel");
	this.lateral.id = "list";

	this.eventview = new webca.EventView(this, intf, ui);

	this.element.appendChild(this.lateral);
	this.element.appendChild(this.eventview.element);
}

webca.PanelView.prototype = {
	activate: function (e, i, o) {
		for (var j=0; j<this.lis.length; j++) {
			if (j === i || e == this.lis[j] || this.lis[j].getAttribute("data-id") == o) {
				this.lis[j].addClass("active");
				this.lateral.addClass("nottoday");
				this.ui.menus[4].element.addClass("doshow");
				this.eventview.setEvent(j);
			} else {
				this.lis[j].removeClass("active");
			}
		}
	},

	setData: function (data, isFiltered) {
		this.eventview.setData(data);

		this.lateral.innerHTML = "";

		if (isFiltered) {
			var clear = document.createElement("button");
			clear.style.background = "#C2AA71";
			clear.style.border = "none";
			clear.style.fontWeight = "bold";
			clear.style.padding = "5px";
			clear.style.color = "white";
			clear.appendChild(document.createTextNode("Clear filter"));
			clear.addEventListener('click', function () {
				this.dashboard.update();
			}.bind(this));
			this.lateral.appendChild(clear);
		}

		var db = this.intf;
		var dash = this.dashboard;
		this.lis = [];
		for (var i=0; i<data.length; i++) {
			var li = document.createElement("li");
			li.draggable = true;
			li.addEventListener("dragstart", function (event) {
				$("#trash").fadeIn();
				event.dataTransfer.setData("Text", this)
			}.bind(data[i].id));
			li.addEventListener("dragend", function (event) {
				$("#trash").fadeOut().removeClass("dragging");
				$(".dragover").removeClass("dragover");
			}.bind(data[i].id));
			li.ondragover = function (event) {
				$(".dragover").removeClass("dragover");
				$(this).addClass("dragover");
				return false;
			};
			li.ondrop = function (event) {
				var targetid = this[0].getAttribute("data-id");
				var sourceid = event.dataTransfer.getData("text/plain");

				db.changePositions(sourceid, targetid, function () {
					dash.update(function () {
						this[1].activate(null, null, sourceid);
					}.bind(this));
				}.bind(this));

				return false;
			}.bind([li,this]);
			li.appendChild(document.createTextNode(data[i].subject));
			li.addEventListener("click", function () {
				this.that.activate(this.li);
			}.bind({that: this, li: li}));
			li.setAttribute("data-id", data[i].id);
			this.lateral.appendChild(li);
			this.lis[this.lis.length] = li;
		}

		this.activate(null, 0);

		if (data.length == 0) {
			this.lateral.innerHTML = '<div style="margin:15px;color:#695015">Here the events will be displayed in a list. Right now, there are none to display.</div>';
		}

	}
}

webca.DashboardView = function (intf, ui) {
	this.intf = intf;

	this.view = new webca.PanelView(intf, this, ui);
	this.element = this.view.element;
}

webca.DashboardView.prototype = {
	update: function (callback) {
		this.intf.getEvents(function (d) {
			this.view.setData(d);
			if (callback) callback();
		}.bind(this));
	}
}

webca.AddEventView = function (intf, ui) {
	this.element = document.createElement("div");
	this.element.className = "text-panel";

	this.text = document.createElement("div");
	this.text.className = "text-panel-content";
	this.text.id = "addpanel";
	this.element.appendChild(this.text);

	var h2 = document.createElement("h2");
	h2.appendChild(document.createTextNode("Add event"));
	this.text.appendChild(h2);

	var subject = document.createElement("input");
	subject.style.width = "60%";

	this.onActivate = function () {
		subject.focus();
	};

	var contents = document.createElement("textarea");
	contents.style.width = "80%";
	this._date = document.createElement("input");
	this._date.addEventListener('focus', function () {
		this.radio2.checked = true;
	}.bind(this));
	var tags = document.createElement("input");

	var Subject = document.createElement("dt");
	Subject.appendChild(document.createTextNode("Subject"));
	var Contents = document.createElement("dt");
	Contents.appendChild(document.createTextNode("Contents"));
	var _When = document.createElement("dt");
	_When.appendChild(document.createTextNode("When"));
	var Tags = document.createElement("dt");
	Tags.appendChild(document.createTextNode("Tags (comma-separated)"));

	var dSubject = document.createElement("dd");
	dSubject.appendChild(subject);

	var dContents = document.createElement("dd");
	dContents.appendChild(contents);

	var dWhen = document.createElement("dd");
		var label1 = document.createElement("label");
		dWhen.appendChild(label1);
		var radio1 = document.createElement("input");
		radio1.name = "when";
		radio1.checked = true;
		radio1.type = "radio";
		label1.appendChild(radio1);
		label1.appendChild(document.createTextNode("No time specified"));
		dWhen.appendChild(label1);

		var label2 = document.createElement("p");
		dWhen.appendChild(label2);
		var radio2 = document.createElement("input");
		radio2.name = "when";
		this.radio2 = radio2;
		radio2.type = "radio";
		label2.appendChild(radio2);
		label2.appendChild(this._date);
		dWhen.appendChild(label2);

	var dTags = document.createElement("dd");
	dTags.appendChild(tags);

	var submit = document.createElement("button");
	submit.className = "btn";
	submit.appendChild(document.createTextNode("Add event"));

	this.text.appendChild(Subject);
	this.text.appendChild(dSubject);
	this.text.appendChild(Contents);
	this.text.appendChild(dContents);
	this.text.appendChild(_When);
	this.text.appendChild(dWhen);
	this.text.appendChild(Tags);
	this.text.appendChild(dTags);
	this.text.appendChild(document.createElement("br"));
	this.text.appendChild(submit);

	submit.addEventListener('click', function () {
		if (subject.value == "") {
			toastr.warning("Please enter, at least, a subject for this event.", "Enter a subject");
			return;
		}
		var time = 0;
		if (radio2.checked) {
			time = this.date.getSelectedAsDates()[0].getTime();
		}
		intf.addEvent(subject.value, $(contents).val(), time, tags.value.split(","), function () {
			ui.menus[0].view.update();
			ui.openMenu(0);
			subject.value = "";
			contents.value = "";
			this._date.value = "";
			tags.value = "";
		}.bind(this));

	}.bind(this));
}

webca.SearchView = function (intf, ui) {
	this.element = document.createElement("div");
	this.element.className = "text-panel";

	this.text = document.createElement("div");
	this.text.className = "text-panel-content";
	this.text.id = "searchpanel";
	this.element.appendChild(this.text);

	var h2 = document.createElement("h2");
	h2.appendChild(document.createTextNode("Search"));
	this.text.appendChild(h2);

	var fulltext = document.createElement("input");

	this.onActivate = function () {
		fulltext.focus();
	};

	var Fulltext = document.createElement("dt");
	Fulltext.appendChild(document.createTextNode("Full text search (subject and contents)"));

	var dFulltext = document.createElement("dd");
	dFulltext.appendChild(fulltext);
	this.text.appendChild(Fulltext);
	this.text.appendChild(dFulltext);


	var tags = document.createElement("input");

	var Tags = document.createElement("dt");
	Tags.appendChild(document.createTextNode("Contains the following tag"));

	var dTags = document.createElement("dd");
	dTags.appendChild(tags);
	this.text.appendChild(Tags);
	this.text.appendChild(dTags);


	this.time1 = document.createElement("input");
	this.time2 = document.createElement("input");

	var Time = document.createElement("dt");
	Time.appendChild(document.createTextNode("Event between"));

	var dTime = document.createElement("dd");
	dTime.appendChild(this.time1);
	dTime.appendChild(document.createTextNode(" and "));
	dTime.appendChild(this.time2);
	this.text.appendChild(Time);
	this.text.appendChild(dTime);


	var submit = document.createElement("button");
	submit.className = "btn";
	submit.appendChild(document.createTextNode("Search"));
	submit.addEventListener("click", function() {
		var time1 = this.date1.getSelectedAsDates()[0];
		var time2 = this.date2.getSelectedAsDates()[0];

		var range = [];

		if (time1 && time2) {
			range = [time1.getTime(), time2.getTime()];
			if (range[0] > range[1]) {
				toastr.warning("The second date is greater than the first date.", "Error in the time range");
				return;
			}
		}

		intf.filterEvents(fulltext.value, tags.value, range, function (data) {
			if (data.length == 0) {
				toastr.warning("No results found; please change your search terms.", "No results");
				return;
			}
			ui.menus[0].view.view.setData(data, true);
			ui.openMenu(0);
		});

	}.bind(this));
	this.text.appendChild(document.createElement("br"));
	this.text.appendChild(submit);
}

webca.AboutView = function () {
	this.element = document.createElement("div");
	this.element.className = "text-panel";

	this.text = document.createElement("div");
	this.text.className = "text-panel-content";
	this.text.id = "aboutpanel";
	this.element.appendChild(this.text);

	var p = document.createElement("p");
	p.appendChild(document.createTextNode("WebCalcium is an open source application which acts as a mix of a calendar and to-do list. You can add events, tag them, add a date; then, using the search tool, you can filter them by the previous paramaters or full-text search."));
	this.text.appendChild(p);
	
	var p = document.createElement("p");
	p.appendChild(document.createTextNode("Its interface adapts to different screens, from desktop to smartphone, with tablets in the middle. The toolbar will take more or less space according to the width, and the dual pane will be enabled in large enough screens."));
	this.text.appendChild(p);
	
	var p = document.createElement("h2");
	p.appendChild(document.createTextNode("Technical part"));
	this.text.appendChild(p);

	var p = document.createElement("p");
	p.appendChild(document.createTextNode("This application uses HTML5, CSS3 (transitions, media queries, fonts, text-overflow...) and some of the newest JavaScript interfaces (indexedDB, History API...)."));
	this.text.appendChild(p);
	
	var p = document.createElement("p");
	p.appendChild(document.createTextNode("The code is fairly organized: database interactions occur in the file 'database.js' which abstracts the rather complex indexedDB interface; the file 'library.js' contains the UI handler and is mostly independent (since styling occurs in CSS). 'views.js' is the core of it, handling the various views (dashboard, add event...)."));
	this.text.appendChild(p);

	var p = document.createElement("p");
	p.appendChild(document.createTextNode("Note that HTML input is allowed in the text contents (not subject, though), because the user fully controls the application and there is no risk of XSS."));
	this.text.appendChild(p);
}