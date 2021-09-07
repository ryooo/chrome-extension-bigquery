chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
		if (document.readyState === "complete") {
			// clearInterval(readyStateCheckInterval);
			attach();
		}
	}, 1000);
});
function collectionHas(a, b) { //helper function (see below)
    for(var i = 0, len = a.length; i < len; i ++) {
        if(a[i] == b) return true;
    }
    return false;
}
function findParentBySelector(elm, selector) {
    var all = document.querySelectorAll(selector);
    var cur = elm.parentNode;
    while(cur && !collectionHas(all, cur)) { //keep going up until you find a match
        cur = cur.parentNode; //go up
    }
    return cur; //will return null if not found
}

const attach = function() {
	const queryValidationStatuses = document.querySelectorAll(".query-validation-status:not(.query-check-extension-attached)");
	queryValidationStatuses.forEach(function(queryValidationStatus, i) {
		queryValidationStatus.classList.add("query-check-extension-attached")
		const runButton = findParentBySelector(queryValidationStatus, ".cfc-action-bar-layout-parent").querySelector(".bqui-test-run-query");
		console.log(queryValidationStatus);
		const callback = function(changes) {
			const text = queryValidationStatus.textContent
			console.log(text);
			const regex = /このクエリを実行すると、(?<number>\d\S*) (?<unit>\S+)/;
			const match = regex.exec(text);

			if (!match) {
				return;
			}

			const unitToExponent = ["B", "KiB", "MiB", "GiB", "TiB"];
			const numberOfBytes =  match.groups.number * Math.pow(1024, unitToExponent.indexOf(match.groups.unit))
			const estimatedCost = Math.round(6.00 * numberOfBytes / Math.pow(1024, 4)*100)/100;

			runButton.textContent = "実行 " + match.groups.number + match.groups.unit + " @ " + estimatedCost + " $ USD";
			runButton.disabled = false;
			if (match.groups.unit == "TiB" && match.groups.number >= 10) {
				runButton.style.backgroundColor = "#ff7f7f";
				runButton.disabled = true;
				setTimeout(function() {
					alert("このSQLは検索範囲が大きいため、実行できません。\n条件式に分割フィールドを加えて検索範囲を狭めてください。\n" + match.groups.number + match.groups.unit + " \n@ " + estimatedCost + " $ USD")
				}, 10)
			} else if (estimatedCost >= 5) {
				runButton.style.backgroundColor = "#da7373";
				runButton.disabled = false;
			} else if (estimatedCost >= 2) {
				runButton.style.backgroundColor = "#e6ea02";
			} else {
				runButton.style.backgroundColor = "#3367d6";
			}
		};

		const mutationObserver = new MutationObserver(callback);
		mutationObserver.observe(queryValidationStatus, {childList: true, subtree: true});

		runButton.onclick = function() {
			mutationObserver.disconnect();
			const checkReadyToAttachInterval = setInterval(function() {
				console.log("Waiting for query to complete to attach to DOM...");
				const queryValidationStatus = document.querySelector("query-validation-status");
				if (!queryValidationStatus) {
					return;
				}
				clearInterval(checkReadyToAttachInterval)
				attach();
			}, 1000);
		}
	});
};
