// ==UserScript==
// @name         Google Maps Pano Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*.google.com/local/imagery/report/*
// @require      https://code.jquery.com/jquery-3.6.3.min.js
// @require      https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js
// @require      https://code.jquery.com/ui/1.13.1/jquery-ui.min.js
// @resource     PANOVIEW https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css
// @resource     UICSS https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css
// @icon         https://www.google.com/s2/favicons?sz=64&domain=example.com
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

// https://creativecoding.soe.ucsc.edu/courses/cs526/papers/Cavallo_3DCityReconstruction2015.pdf
// https://earth.google.com/web/@33.66067346,-117.66092875,243.89608209a,0d,60y,183.31218558h,71.35119943t,0r/data=IhoKFlA4Z2pWb1liNHYxQk5sMjZ2dHBRakEQAg
// https://www.google.com/local/imagery/report/?cb_client=earth.iv&cbp=1,0,,0,0&gl=US&hl=en&image_key=%211e2%212s7q_90B0sQurvz9YWoQtClQ
// tiles: w7 h4 (x 0-6, y 0-3)

(function () {
  const getPhotoSpherePano = (key) => {
    // CHECK IF THIS WIDTH IS UNIVERSAL, current max???
    let url = $("#preview-image").attr("src").replace(/=w.*/gm, "=w16383");
    $.ajax({
      type: "GET",
      url,
      beforeSend: function (xhr) {
        xhr.overrideMimeType("text/plain; charset=x-user-defined");
      },
      success: function (result, textStatus, jqXHR) {
        if (result.length < 1) {
          alert("The thumbnail doesn't exist");
          $("#thumbnail").attr("src", "data:image/png;base64,");
          return;
        }

        var binary = "";
        var responseText = jqXHR.responseText;
        var responseTextLen = responseText.length;

        for (let k = 0; k < responseTextLen; k++) {
          binary += String.fromCharCode(responseText.charCodeAt(k) & 255);
        }

        $(
          `<img id="panoTile" src="data:image/png;base64,${btoa(
            binary
          )}" style="grid-area: 1 / 1 / span 1 / span 1;" />`
        ).appendTo("#image_div");

        fetch(`data:image/png;base64,${btoa(binary)}`)
          .then((res) => res.blob())
          .then((blob) => {
            pannellum.viewer("panorama", {
              type: "equirectangular",
              panorama: URL.createObjectURL(blob),
              autoRotateInactivityDelay: 3000,
              autoRotate: 15,
            });
          });
      },
      error: function (xhr, textStatus, errorThrown) {
        console.log(`error: ${errorThrown}`);
      },
    });
  };

  GM_addStyle(`
    #image_div {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr;
    }

    #download {
        padding: 5px;
        color: white;
    }

        #panorama {
        width: 1200px;
        height: 800px;
    }
    `);

  $(`<button id="download">Download Pano</button>`).prependTo("c-wiz");

  $(`
    <div id="dialog-confirm" title="Empty the recycle bin?">
    <div id="image_div"></div>
    <p>testttttt</p>
  </div>
    `).insertAfter(".O3cKLb");
  $("#dialog-confirm").dialog({
    resizable: false,
    height: "auto",
    width: 400,
    modal: true,
    buttons: {
      "Delete all items": function () {
        $(this).dialog("close");
      },
      Cancel: function () {
        $(this).dialog("close");
      },
    },
  });

  $("#dialog-confirm").dialog({
    resizable: false,
    height: "auto",
    width: 400,
    modal: true,
    buttons: {
      "Delete all items": function () {
        $(this).dialog("close");
      },
      Cancel: function () {
        $(this).dialog("close");
      },
    },
  });

  GM_addStyle(GM_getResourceText("PANOVIEW"));
  GM_addStyle(GM_getResourceText("UICSS"));

  $(`<div id="panorama"></div>`).insertAfter(".GUPete");

  $("#download").on("click", () => {
    console.log("hi");
    let key = window.location.href.match(/%212s(.*)/)[1];
    if ($("#streetview-preview").length) {
      getStreetViewPano(key);
    } else {
      getPhotoSpherePano(key);
    }
    console.log(key);
  });
})();
