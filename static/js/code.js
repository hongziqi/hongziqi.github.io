document.addEventListener("DOMContentLoaded", function() {
    var copyButtons = document.querySelectorAll('.btn-copy-code');

    copyButtons.forEach(function(button) {
       // 动态创建下箭头按钮
       var toggleButton = document.createElement('button');
       toggleButton.classList.add('toggle-button');
       button.parentNode.insertBefore(toggleButton, button);

       // 动态创建窗口控制按钮
       var windowControls = document.createElement('div');
       windowControls.classList.add('window-controls');
       var redDot = document.createElement('div');
       redDot.classList.add('dot', 'red');
       var yellowDot = document.createElement('div');
       yellowDot.classList.add('dot', 'yellow');
       var greenDot = document.createElement('div');
       greenDot.classList.add('dot', 'green');
       windowControls.appendChild(redDot);
       windowControls.appendChild(yellowDot);
       windowControls.appendChild(greenDot);
       button.parentNode.insertBefore(windowControls, button);

       // 根据主题切换箭头图片
       function updateToggleButtonImage() {
           if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
               toggleButton.style.backgroundImage = 'url("/img/down-light.png")';
           } else {
               toggleButton.style.backgroundImage = 'url("/img/down-dark.png")';
           }
       }

       // 初始设置箭头图片
       updateToggleButtonImage();

       // 监听主题变化
       window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateToggleButtonImage);

        button.addEventListener('click', function() {
            // 执行复制操作
            var codeBlock = button.previousElementSibling.querySelector('code');
            var range = document.createRange();
            range.selectNode(codeBlock);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);

            try {
                document.execCommand('copy');
                window.getSelection().removeAllRanges();

                // 更改按钮文本和样式
                button.textContent = '已复制';
                button.classList.add('copied');
                
                // 一段时间后恢复按钮文本和样式
                setTimeout(function() {
                    button.textContent = '复制';
                    button.classList.remove('copied');
                }, 1000);
            } catch (err) {
                console.error('复制失败', err);
            }
        });

         // 添加下箭头按钮的点击事件
         toggleButton.addEventListener('click', function() {
            var highlight = button.closest('.highlight');
            highlight.classList.toggle('collapsed');
        });
    });
});
