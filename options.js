﻿// (c) 2013 daiz.
// License: MIT
// 0002

all_ID = [1, 2, 3];
//document.addEventListener("click", createGDriveBtn, false);
document.getElementById("itemArea").addEventListener("click", edit_remove_set, false);
document.getElementById("export").addEventListener("click", pExport, false);
document.getElementById("inport").addEventListener("click", pIn, false);

databox = {};

pinport = {};
pinport.arry = [];
pinport.Now = 1;

googdrv = {};
googdrv.max = 0;

function pIn() {
    if (document.getElementById("inport_area").value != "") {
        pinport.arry = JSON.parse(document.getElementById("inport_area").value);
        if (pinport.arry.length > 1) {
            // # 最初の1件は写真データではない
            document.getElementById("inport_area").value = "";
            document.getElementById("inport_area").placeholder = "しばらくお待ちください...";
            pInport();
        }
    }
}

function pInport() {
    // # 繰り返し呼ばれる（再帰的に）
    if (pinport.Now < pinport.arry.length) {
        var item = pinport.arry[pinport.Now];
        var web = item.web;
        var page = item.page;
        var x = item.tags.x;
        var ys = item.tags.ys;
        for (u = 0; u < ys.length; u++) {
            if (ys[u] == "ごちそう") {
                ys.splice(u, 1);
            }
        }
        pinport.Now = pinport.Now + 1;
        console.log("1件の写真をインポートします");
        chrome.extension.sendRequest({action: "add_photo",url: web,tag: ys,page_url: page}, pInport);
    } else {
        document.getElementById("inport_area").value = "";
        document.getElementById("inport_area").placeholder = (pinport.Now - 1) + "件のデータをインポートしました";
        chrome.extension.sendRequest({action: "add_select_box",query: "all"}, addSelectBox);
        chrome.extension.sendRequest({action: "at_miil_user_page",query: "ごちそう"}, getAllPhotos);
    }
}


function pExport() {
    chrome.extension.sendRequest({action: "export",query: "ごちそう"}, ExOutput);
}

function ExOutput(arry) {
    document.getElementById("export_area").value = JSON.stringify(arry);
    if (document.getElementById("q_rm").checked == true) {
        chrome.extension.sendRequest({action: "clear_store"}, removend_all);
    }
}

function removend_all() {
    document.getElementById("griddles_select").innerHTML = '<option value="ごちそう" id="opt_ごちそう">ごちそう</option>';
    var bkg = chrome.extension.getBackgroundPage();
    bkg.location.reload()
    setter = angular.element(itemArea).scope();
    setter.$apply(function() {
        setter.photos = [];
    });
}

function edit_remove_set(e) {
    databox.url = "";
    eventID = e.target.id;
    action = eventID[0];
    url = eventID.substring(2, eventID.length);
    if (eventID[0] == "e") {
        // このリクエストはあり得ない
        console.log("edit");
    } else if (eventID[0] == "r") {
        console.log("remove");
        databox.rmURL = url;
        unique_key = ((url.replace(/\//gi, "_1_")).replace(/\./gi, "_2_")).replace(/\:/gi, "_0_");
        chrome.extension.sendRequest({action: "remove_photo",unique_key: unique_key}, removend);
    } else if (eventID[0] == "s") {
        console.log("set");
        // 登録する際に"ごちそう"を含めることを忘れずに！
        // セレクトボックスの更新も
        // unique_key = ((url.replace(/\//gi, "_1_")).replace(/\./gi, "_2_")).replace(/\:/gi,"_0_");
        ykeys = document.getElementById("i_" + url).value;
        if (ykeys == "") {
            yQuery = [];
        //yQuery = ["ごちそう"];
        } else {
            yQuery = ykeys.split(",");
        //yQuery.push("ごちそう");
        }
        pageURL = e.target.name;
        chrome.extension.sendRequest({action: "add_photo",url: url,tag: yQuery,page_url: pageURL}, addend);
    } else if (eventID[0] == "w") {
        pageURL = e.target.name;
        var prmpt = window.prompt("ツイート時コピペ用：", "食べたい！" + " " + pageURL /* + " " + url*/);
    }
}

function removend() {
    console.log("1件の写真を削除しました");
    document.getElementById("waku_" + databox.rmURL).style.display = "none";
}

function addend() {
    console.log("タグを更新しました");
    chrome.extension.sendRequest({action: "add_select_box",query: "all"}, addSelectBox);
}

function setYtag(jn) {
    ys = jn.ys;
    x = jn.x;
    url = ((x.replace(/\_1\_/gi, "/")).replace(/\_2\_/gi, ".")).replace(/\_0\_/gi, ":");
    for (i = 0; i < ys.length; i++) {
        if (ys[i] == "ごちそう") {
            ys.splice(i, 1);
        }
    }
    url = url.replace(/=s[0-9][0-9][0-9]/gi, "");
    console.log(url);
    if (ys.toString() == "") {
        document.getElementById("i_" + url).placeholder = "未登録です";
    } else {
        document.getElementById("i_" + url).value = ys.toString();
        document.getElementById("i_" + url).placeholder = "入力して下さい";
    }
}


function loadend() {
    for (i = 0; i < all_ID.length; i++) {
        document.getElementById("i" + all_ID[i]).addEventListener("click", toggle, false);
    }
    chrome.extension.sendRequest({action: "add_select_box",query: "all"}, addSelectBox);
    chrome.extension.sendRequest({action: "at_miil_user_page",query: "ごちそう"}, getAllPhotos);
}

function getAllPhotos(jsn) {
    item = jsn.items;
    xs = jsn.x_keys;
    databox.item = [];
    for (i = 0; i < xs.length; i++) {
        var ji = item[xs[i]];
        ji.time = i;
        databox.item.push(ji);
    }
    googdrv.max = i;
    console.log(databox.item);
    setter = angular.element(itemArea).scope();
    setter.$apply(function() {
        setter.photos = databox.item;
    });
    
    for (i = 0; i < xs.length; i++) {
        chrome.extension.sendRequest({action: "get_y_tags",unique_key: xs[i]}, setYtag);
    }
}

// # プログラムによる表示非表示切り替え
function _toggle(i) {
    iID = i;
    mID = "#" + iID.replace(/i/, "m");
    if ($(mID).is(":hidden")) {
        mReset(mID);
        document.getElementById(iID).style.fontWeight = "bold";
        document.getElementById(iID).style.backgroundColor = "#e5e5e5";
        $(mID).slideDown();
    } else {
        document.getElementById(iID).style.fontWeight = "normal";
        document.getElementById(iID).style.backgroundColor = "#fff";
        $(mID).slideUp();
    }
}

function toggle(e) {
    iID = e.target.id;
    mID = "#" + (e.target.id).replace(/i/, "m");
    if ($(mID).is(":hidden")) {
        mReset(mID);
        document.getElementById(iID).style.fontWeight = "bold";
        document.getElementById(iID).style.backgroundColor = "#e5e5e5";
        $(mID).slideDown();
    } else {
        document.getElementById(iID).style.fontWeight = "normal";
        document.getElementById(iID).style.backgroundColor = "#fff";
        $(mID).slideUp();
    }
}


function mReset(mid) {
    console.log(mid);
    // # mid 以外のidのメインパネルを非表示にする。
    for (i = 0; i < all_ID.length; i++) {
        if (mid == "#m" + all_ID[i]) {
        // 何もしない。
        } else {
            if ($("#m" + all_ID[i]).is(":hidden")) {
            // 何もしない。
            } else {
                document.getElementById("i" + all_ID[i]).style.fontWeight = "normal";
                document.getElementById("i" + all_ID[i]).style.backgroundColor = "#fff";
                $("#m" + all_ID[i]).slideUp();
            }
        }
    }
}

function addSelectBox(all_query) {
    console.log(all_query);
    for (i = 0; i < all_query.length; i++) {
        if (all_query[i] == "ごちそう") {
            all_query.splice(i, 1);
        }
    }
    all_query.unshift("ごちそう");
    var sbx = document.getElementById("griddles_select");
    for (i = 0; i < all_query.length; i++) {
        if (document.getElementById("opt_" + all_query[i]) == null) {
            // # 無ければ作る
            console.log("sbx: %d", i);
            var option = document.createElement("option");
            option.value = all_query[i];
            option.id = "opt_" + all_query[i];
            tit = document.createTextNode(all_query[i]);
            option.appendChild(tit);
            sbx.appendChild(option);
        }
    }
    document.getElementById("griddles_select").addEventListener("change", requestQuery, false);
}

function requestQuery(e) {
    query = document.getElementById(e.target.id).value;
    console.log("req_q: %s", query);
    chrome.extension.sendRequest({action: "at_miil_user_page",query: query}, getAllPhotos);
}

function setter($http, $scope) {
    $scope.photos = [];
}

/*
function renderSaveToDrive(i) {
    var obj = document.getElementById("g-d-btn-" + i);
    var src = obj.dataset.src;
    var page = obj.dataset.page;
    
    gapi.savetodrive.render("savetodrive-div-" + i, {
        src: src,
        filename: page + ".jpeg",
        sitename: 'ミイルごちそうカード'
    });

}

function createGDriveBtn(e) {
    if ((e.target.id).search("cgdr") != -1) {
        i = document.getElementById(e.target.id).name;
        console.log(i);
        renderSaveToDrive(i);
    }
}
*/

loadend();
