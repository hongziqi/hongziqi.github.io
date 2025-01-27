document.addEventListener("DOMContentLoaded", function() {
    var copyButtons = document.querySelectorAll('.btn-copy-code');
    var recentPostsIcon = document.getElementById('recent-posts-icon');

    function updateRecentPostsIcon() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            recentPostsIcon.src = '/img/recent-posts-light.png';
        } else {
            recentPostsIcon.src = '/img/recent-posts-dark.png';
        }
    }
    // 初始设置图片
    updateRecentPostsIcon();

    // 监听主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateRecentPostsIcon);

    copyButtons.forEach(function(button) {
        // 动态创建下箭头按钮
        var toggleButton = document.createElement('button');
        toggleButton.classList.add('toggle-button');
        button.parentNode.insertBefore(toggleButton, button.nextSibling); // 插入到按钮之后

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
        button.parentNode.insertBefore(windowControls, button.nextSibling);

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
            var codeBlock = button.parentNode.querySelector('pre code'); // 使用更精确的选择器
            if (codeBlock) {
                console.log('找到代码块:', codeBlock); // 调试信息
                var range = document.createRange();
                range.selectNodeContents(codeBlock); // 使用 selectNodeContents 选择代码块内容
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);

                try {
                    document.execCommand('copy');
                    window.getSelection().removeAllRanges();

                    // 更改按钮文本和样式
                    button.textContent = '已复制';
                    button.classList.add('copied');
                    console.log('按钮文本已更改为 "已复制"');
                    
                    // 一段时间后恢复按钮文本和样式
                    setTimeout(function() {
                        button.classList.remove('copied');
                        button.blur(); // 移除按钮的焦点
                        document.body.focus(); // 将焦点转移到 body 或其他元素
                        button.textContent = '复制';
                    }, 1100);
                } catch (err) {
                    console.error('复制失败', err);
                }
            } else {
                console.error('未找到代码块');
            }
        });

        // 添加下箭头按钮的点击事件
        toggleButton.addEventListener('click', function() {
            var highlight = button.closest('.highlight');
            highlight.classList.toggle('collapsed');
        });
    });
});
