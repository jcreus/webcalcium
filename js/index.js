(function () {
	/* BRIEF SUMMARY OF THE STRUCTURE OF THE CODE
	 *
	 * The code is organized in several classes. The main class is:
	 *  > webca.Interface @ library.js.
	 *    It handles the different views and the toolbar (Dashboard, Add event, Search, About).
	 *    The code is fairly reusable, since most styling is done in index.css.
	 *  > webca.Menu @ library.js:
	 *    It handles the different tabs.
	 *  > webca.*******View @ views.js:
	 *    They are the controllers which handle the different tabs. There is one view per tab,
	 *    although some extras such as PanelView are separate to be reusable.
	 *  > webca.DBInterface @ database.js:
	 *    It interfaces with the IndexedDB database, exposing some methods such as getEvents or
	 *    addEvent.
	 *
	 * More or less, this is all. Further comments spread along the code.
	 */

	var views, menus;

	var ui = new webca.Interface(); // UI handler

	var dbinterface = new webca.DBInterface(); // Database handler
	dbinterface.connect(load); // Connect to the database and create it, if required

	views = {
		dashboard: new webca.DashboardView(dbinterface, ui),
		addevent: new webca.AddEventView(dbinterface, ui),
		search: new webca.SearchView(dbinterface, ui),
		about: new webca.AboutView()
	}

	menus = {
		dashboard: new webca.Menu({name: "Dashboard", view: views.dashboard, img: "home", path: "index.html"}),
		addevent: new webca.Menu({name: "Add event", view: views.addevent, img: "add", path: "add.html"}),
		back: new webca.Menu({name: "Back", view: null, img: "back", path: null, callback: false, end: true}),
		search: new webca.Menu({name: "Search", view: views.search, img: "search", path: "search.html", end: true}),
		about: new webca.Menu({name: "WebCalcium", view: views.about, img: "information", path: "about.html", end: true})
	}
	ui.addMenu(menus.dashboard);
	ui.addMenu(menus.addevent);
	ui.addMenu(menus.about);
	ui.addMenu(menus.search);
	ui.addMenu(menus.back);

	// The "go back" button is hidden by default. It is enabled via CSS in small screens.
	menus.back.element.style.display = "none";
	menus.back.element.id = "goback";
	menus.back.element.addEventListener("click", function () {
		views.dashboard.view.lateral.removeClass("nottoday");
		menus.back.element.removeClass("doshow");
		this.style.display = "none";
	})

	function load() {
		// It make take longer if it needs to create the database, let's check if onload has been fired.
		// If it hasn't, we add the event; else, we fire it ourselves (it won't fire if the listener is
		// added after being fired).
		if (document.readyState == "complete") {
			DOMload();
		} else {
			window.addEventListener('load', DOMload);
		}
		views.dashboard.update();
	}

	function DOMload() {
		document.body.appendChild(ui.element);
		ui.onLoad();
		menus.addevent.view.date = new Kalendae.Input(menus.addevent.view._date, {months: 1});
		views.search.date1 = new Kalendae.Input(views.search.time1);
		views.search.date2 = new Kalendae.Input(views.search.time2);
		setMaxWidth();

		$(document.body).append($("<img></img>")
			.attr("src", "img/trash.svg")
			.attr("id", "trash")
			.bind("dragover", function () { $(this).addClass("dragging"); return false; })
			.bind("dragleave", function () { $(this).removeClass("dragging"); return false; })
			.bind("drop", function (event) { dbinterface.removeEvent(parseInt(event.originalEvent.dataTransfer.getData("text/plain")), function () {
				views.dashboard.update();
			}); }));

		$(window).bind('resize', function () { // So that 
			setMaxWidth();
		});
	}

	function setMaxWidth() {
		document.getElementById("addpanel").style.minHeight = 
		document.getElementById("mainpanel").style.minHeight = 
		document.getElementById("searchpanel").style.minHeight = 
		document.getElementById("aboutpanel").style.minHeight =
		document.getElementById("list").style.height = innerHeight-document.getElementById("nav").offsetHeight+"px";
	}
})();