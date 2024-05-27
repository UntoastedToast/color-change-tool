$(document).ready(function () {
    let isImageUploaded = false;
    let polygonPoints = [];
  
    $(".upload-area").on('dragover', function (e) {
      e.stopPropagation();
      e.preventDefault();
      $(this).addClass('dragging');
    });
  
    $(".upload-area").on('dragleave', function (e) {
      e.stopPropagation();
      e.preventDefault();
      $(this).removeClass('dragging');
    });
  
    $(".upload-area").on('drop', function (e) {
      e.stopPropagation();
      e.preventDefault();
      $(this).removeClass('dragging');
      var file = e.originalEvent.dataTransfer.files;
      showFile(file[0]);
    });
  
    $(".upload-area").click(function () {
      $("#file").click();
    });
  
    $("#file").change(function () {
      var file = this.files[0];
      showFile(file);
    });
  
    function showFile(file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = $('<img>').attr('src', e.target.result).addClass('img-responsive thumbnail');
        $(".image-preview").html(img);
        isImageUploaded = true;
        enableButtons();
        goToStep('deselection');
        setupCanvas(img[0]);
      }
      reader.readAsDataURL(file);
    }
  
    function enableButtons() {
      $("#deselection-btn, #coloring-btn, #save-btn").removeClass('disabled');
    }
  
    function setupCanvas(img) {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.id = 'canvas';
      $('.image-preview').append(canvas);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);
      $(canvas).show();
  
      canvas.addEventListener('click', function (e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        polygonPoints.push({ x, y });
        drawPolygon(ctx);
      });
    }
  
    function drawPolygon(ctx) {
      if (polygonPoints.length === 0) return;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const img = $('.image-preview img')[0];
      ctx.drawImage(img, 0, 0, img.width, img.height);
  
      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  
    $("#upload-btn").click(function () {
      goToStep('upload');
    });
  
    $("#deselection-btn").click(function () {
      if (isImageUploaded) {
        goToStep('deselection');
      }
    });
  
    $("#coloring-btn").click(function () {
      if (isImageUploaded) {
        goToStep('coloring');
      }
    });
  
    $("#apply-selection").click(function () {
      goToStep('coloring');
    });
  
    $("#apply-color").click(function () {
      applyColorChange();
    });
  
    function applyColorChange() {
      const img = $('.image-preview img')[0];
      if (!img) return;
  
      const sourceColor = hexToRgb($("#source-color").val());
      const targetColor = hexToRgb($("#target-color").val());
  
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
  
      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);
        if (!isPointInPolygon({ x, y }, polygonPoints) && isColorMatch(data, i, sourceColor)) {
          data[i] = targetColor.r;
          data[i + 1] = targetColor.g;
          data[i + 2] = targetColor.b;
        }
      }
  
      ctx.putImageData(imageData, 0, 0);
      const newImgUrl = canvas.toDataURL();
      $('.image-preview').html(`<img src="${newImgUrl}" class="img-responsive thumbnail">`);
    }
  
    function isPointInPolygon(point, polygon) {
      let isInside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
  
        const intersect = ((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
      }
      return isInside;
    }
  
    function isColorMatch(data, index, color) {
      const tolerance = 50;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      return Math.abs(r - color.r) <= tolerance && Math.abs(g - color.g) <= tolerance && Math.abs(b - color.b) <= tolerance;
    }
  
    function hexToRgb(hex) {
      const bigint = parseInt(hex.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return { r, g, b };
    }
  
    function goToStep(step) {
      $(".toolbar").hide();
      $(".image-controls .btn-effect").removeClass('active');
  
      if (step === 'upload') {
        $("#upload-btn").addClass('active');
      } else if (step === 'deselection') {
        $("#deselection-btn").addClass('active');
        $("#selection-toolbar").show();
      } else if (step === 'coloring') {
        $("#coloring-btn").addClass('active');
        $("#coloring-toolbar").show();
      }
    }
  
    // Set the initial active button to "Upload"
    $("#upload-btn").addClass('active');
  });
  