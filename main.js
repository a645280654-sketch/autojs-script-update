"auto";

// ===== 在线更新配置 =====
var CURRENT_VERSION = "1.0.3";
var VERSION_URL = "https://a645280654-sketch.github.io/autojs-script-update/version.json";

// ===== 更新检测（完成后执行回调） =====
function checkUpdate(callback) {
    threads.start(function() {
        try {
            var response = http.get(VERSION_URL, { timeout: 5000 });
            if (response.statusCode == 200) {
                var data = response.body.json();
                if (data.version && data.version !== CURRENT_VERSION) {
                    ui.run(function() {
                        var dialog = dialogs.build({
                            title: "发现新版本",
                            content: "最新版本: v" + data.version + "\n当前版本: v" + CURRENT_VERSION + "\n是否立即更新？",
                            positive: "更新",
                            negative: "稍后"
                        });
                        dialog.on("positive", function() {
                            threads.start(function() {
                                try {
                                    var newScript = http.get(data.download_url, { timeout: 10000 });
                                    if (newScript.statusCode == 200) {
                                        var scriptPath = "/sdcard/脚本/main.js";
                                        files.write(scriptPath, newScript.body.string());
                                        toast("更新完成，即将重启");
                                        sleep(1000);
                                        engines.execScriptFile(scriptPath);
                                        exit();
                                    } else {
                                        toast("下载失败，继续执行旧版本");
                                        callback();
                                    }
                                } catch(e) {
                                    toast("更新出错，继续执行旧版本");
                                    callback();
                                }
                            });
                        });
                        dialog.on("negative", function() {
                            callback();
                        });
                        dialog.show();
                    });
                    return;
                }
            }
        } catch(e) {
            console.log("更新检测失败: " + e.message);
        }
        callback();
    });
}

// ===== 主程序入口 =====
function startMain() {
    // 尝试用 Root 自动开启无障碍
    try {
        $settings.setEnabled('enable_accessibility_service_by_root', true);
    } catch(e) {
        toast("请手动开启无障碍服务");
        auto.waitFor();
    }
    
    //==============================
    // 1. 用户选择界面
    //==============================
    
    var count = 100;
    var result = null;
    var selectedItem = "能量保护罩";
    var itemList = ["能量保护罩", "能量双击卡", "时光加速器"];
    
    var screenWidth = context.getResources().getDisplayMetrics().widthPixels;
    var screenHeight = context.getResources().getDisplayMetrics().heightPixels;
    
    var drawable = new android.graphics.drawable.GradientDrawable();
    drawable.setColor(
        android.graphics.Color.argb(210, 10, 14, 26)
    );
    drawable.setCornerRadius(30);
    
    var win = floaty.rawWindow(
        <frame>
            <vertical id="panel" padding="20" gravity="center" w="320">
                <text text="✨ 云长道具助手" textSize="22sp" textColor="#FFFFFF" gravity="center" marginBottom="8"/>
                <horizontal gravity="center" marginBottom="12">
                    <text text="🎯 选择道具：" textSize="16sp" textColor="#88BBEE" marginRight="8"/>
                    <button id="itemBtn" text="能量保护罩 ▼" textSize="16sp" textColor="#FFFFFF" w="160" h="40"/>
                </horizontal>
                <text id="numText" text="📊 赠送数量：100 个" textSize="18sp" textColor="#00D4FF" gravity="center" marginBottom="12"/>
                <text text="请选择操作：" textSize="15sp" textColor="#88BBEE" gravity="center" marginBottom="12"/>
                <horizontal gravity="center" marginBottom="6">
                    <button id="opt0" text="➖ 减少100" textSize="16sp" textColor="#FFFFFF" w="130" h="44" marginRight="10"/>
                    <button id="opt1" text="➕ 增加100" textSize="16sp" textColor="#FFFFFF" w="130" h="44"/>
                </horizontal>
                <button id="opt2" text="✏️ 修改数量" textSize="16sp" textColor="#FFFFFF" w="270" h="44" marginBottom="6"/>
                <button id="opt3" text="🚀 开始执行" textSize="16sp" textColor="#FFFFFF" w="270" h="44" marginBottom="6"/>
                <button id="opt4" text="❌ 退出" textSize="15sp" textColor="#FF8888" w="270" h="38"/>
            </vertical>
        </frame>
    );
    
    win.panel.setBackgroundDrawable(drawable);
    
    var winWidth = 320;
    var winHeight = 240;
    var density = context.getResources().getDisplayMetrics().density;
    var winWidthPx = Math.round(winWidth * density);
    var winHeightPx = Math.round(winHeight * density);
    var posX = Math.round((screenWidth - winWidthPx) / 2);
    var posY = Math.round((screenHeight - winHeightPx) / 3);
    win.setPosition(posX, posY);
    
    function setBtnStyle(btn, color) {
        var g = new android.graphics.drawable.GradientDrawable();
        g.setColor(android.graphics.Color.parseColor(color));
        g.setCornerRadius(22);
        btn.setBackgroundDrawable(g);
    }
    
    setBtnStyle(win.opt0, "#334466");
    setBtnStyle(win.opt1, "#334466");
    setBtnStyle(win.opt2, "#334466");
    setBtnStyle(win.opt3, "#00AA66");
    setBtnStyle(win.opt4, "#44000000");
    
    var itemBg = new android.graphics.drawable.GradientDrawable();
    itemBg.setColor(android.graphics.Color.parseColor("#334466"));
    itemBg.setCornerRadius(22);
    win.itemBtn.setBackgroundDrawable(itemBg);
    
    function updateNum() {
        ui.run(function() {
            win.numText.setText("📊 赠送数量：" + count + " 个");
        });
    }
    
    function updateItem() {
        ui.run(function() {
            win.itemBtn.setText(selectedItem + " ▼");
        });
    }
    
    win.itemBtn.click(function() {
        threads.start(function() {
            var index = dialogs.select("🎯 请选择道具", itemList);
            if (index >= 0) {
                selectedItem = itemList[index];
                updateItem();
                toast("已选择: " + selectedItem);
            }
        });
    });
    
    win.opt0.click(function() {
        if (count > 100) {
            count = count - 100;
            updateNum();
            toast(count + " 个");
        } else {
            toast("最少100个");
        }
    });
    
    win.opt1.click(function() {
        if (count < 999) {
            count = count + 100;
            if (count > 999) count = 999;
            updateNum();
            toast(count + " 个");
        } else {
            toast("最多999个");
        }
    });
    
    win.opt2.click(function() {
        threads.start(function() {
            var v = dialogs.rawInput("修改数量", String(count));
            if (v != null) {
                var n = parseInt(v);
                if (!isNaN(n) && n >= 1 && n <= 999) {
                    count = n;
                    updateNum();
                    toast("已设为 " + count);
                } else {
                    toast("请输入1-999");
                }
            }
        });
    });
    
    win.opt3.click(function() {
        if (count < 1) {
            toast("请先设置数量");
            return;
        }
        result = count;
        toast("🎯 " + selectedItem + "，开始赠送 " + result + " 个");
        win.close();
    });
    
    win.opt4.click(function() {
        dialogs.confirm("❓ 确定要退出脚本吗？", "退出后将停止所有操作", function(confirm) {
            if (confirm) {
                toast("👋 已退出");
                win.close();
                exit();
            }
        });
    });
    
    var startX, startY, offsetX, offsetY;
    win.panel.setOnTouchListener(function(view, event) {
        switch (event.getAction()) {
            case android.view.MotionEvent.ACTION_DOWN:
                startX = event.getRawX();
                startY = event.getRawY();
                offsetX = win.getX();
                offsetY = win.getY();
                return true;
            case android.view.MotionEvent.ACTION_MOVE:
                win.setPosition(offsetX + event.getRawX() - startX, offsetY + event.getRawY() - startY);
                return true;
        }
        return false;
    });
    
    while (result == null) {
        sleep(100);
    }
    
    log("最终数量: " + result);
    log("选择道具: " + selectedItem);
    
    //==============================
    // 2. 左上角日志悬浮窗
    //==============================
    
    var itemRegions = {
        "能量保护罩": { x: 573, y: 1147, width: 96, height: 55 },
        "能量双击卡": { x: 236, y: 1146, width: 94, height: 58 },
        "时光加速器": { x: 913, y: 1153, width: 96, height: 50 }
    };
    
    var confirmGiftRegion = {
        x: 546,
        y: 1278,
        width: 352,
        height: 159
    };
    
    threads.start(function() {
        sleep(1000);
        var btn = text("立即开始").findOne(2000);
        if (btn) {
            btn.click();
        } else {
            click(787, 2106);
        }
    });
    requestScreenCapture();
    
    let MLKitOCR = $plugins.load('org.autojs.autojspro.plugin.mlkit.ocr');
    let ocr = new MLKitOCR();
    
    var logBg = new android.graphics.drawable.GradientDrawable();
    logBg.setColor(android.graphics.Color.argb(210, 0, 0, 0));
    logBg.setCornerRadius(30);
    
    var logWin = floaty.rawWindow(
        <vertical id="all" padding="0">
            <vertical id="titleBar" padding="10">
                <text id="titleText" text="云长道具助手" textSize="23sp" textColor="#FFFFFF" gravity="center" typeface="serif" textStyle="bold"/>
            </vertical>
            <vertical id="infoArea" padding="10" bg="#1A1A2E">
                <text id="infoLine1" text="🎯 当前道具：" textSize="14sp" textColor="#88BBEE"/>
                <text id="infoLine2" text="📊 初始:0  目标:0  已送:0" textSize="14sp" textColor="#88BBEE"/>
            </vertical>
            <vertical id="body" padding="10">
                <text id="msg" text="等待启动..." textSize="15sp" textColor="#00FF00" maxLines="5"/>
                <horizontal gravity="center" padding="5" marginTop="4">
                    <button id="pauseBtn" text="暂停" textSize="12sp" w="50" h="28" marginRight="8"/>
                    <button id="stopBtn" text="停止" textSize="12sp" w="50" h="28"/>
                </horizontal>
            </vertical>
        </vertical>
    );
    
    logWin.all.setBackgroundDrawable(logBg);
    
    var titleBg2 = new android.graphics.drawable.GradientDrawable();
    titleBg2.setColor(android.graphics.Color.parseColor("#1A1A2E"));
    titleBg2.setCornerRadius(30);
    logWin.titleBar.setBackgroundDrawable(titleBg2);
    
    var infoBg = new android.graphics.drawable.GradientDrawable();
    infoBg.setColor(android.graphics.Color.parseColor("#0D1A2B"));
    infoBg.setCornerRadius(30);
    logWin.infoArea.setBackgroundDrawable(infoBg);
    
    function roundButton(btn, color) {
        var gd = new android.graphics.drawable.GradientDrawable();
        gd.setColor(android.graphics.Color.parseColor(color));
        gd.setCornerRadius(20);
        btn.setBackgroundDrawable(gd);
        btn.setTextColor(android.graphics.Color.WHITE);
        btn.setTextSize(12);
    }
    roundButton(logWin.pauseBtn, "#009688");
    roundButton(logWin.stopBtn, "#F44336");
    logWin.setPosition(20, 120);
    
    try {
        var typeface = android.graphics.Typeface.create("华文行楷", android.graphics.Typeface.BOLD);
        logWin.titleText.setTypeface(typeface);
    } catch(e) {
        logWin.titleText.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
    }
    
    var logs = [];
    var isPause = false;
    var isStop = false;
    var initialCount = 0;
    var targetCount = 0;
    var sentCount = 0;
    
    function addMsg(text) {
        var d = new Date();
        var time = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
        logs.push(time + " " + text);
        if (logs.length > 5) logs.shift();
        ui.run(function() {
            logWin.msg.setText(logs.join("\n"));
        });
    }
    
    function updateInfo() {
        ui.run(function() {
            logWin.infoLine1.setText("🎯 当前道具：" + selectedItem);
            logWin.infoLine2.setText("📊 初始:" + initialCount + "  目标:" + targetCount + "  已送:" + sentCount);
        });
    }
    
    logWin.pauseBtn.click(function() {
        isPause = !isPause;
        if (isPause) {
            logWin.pauseBtn.setText("继续");
            addMsg("任务已暂停");
        } else {
            logWin.pauseBtn.setText("暂停");
            addMsg("任务继续");
        }
    });
    
    logWin.stopBtn.click(function() {
        isStop = true;
        addMsg("正在停止...");
        try { ocr.release(); } catch(e) {}
        exit();
    });
    
    function getCurrentCount(itemName) {
        var region = itemRegions[itemName];
        if (!region) {
            addMsg("未找到道具区域");
            return null;
        }
        var expand = 20;
        var expandRegion = {
            x: region.x - expand,
            y: region.y - expand,
            width: region.width + expand * 2,
            height: region.height + expand * 2
        };
        var img = captureScreen();
        if (!img) {
            addMsg("截图失败");
            return null;
        }
        var cropImg = images.clip(img, expandRegion.x, expandRegion.y, expandRegion.width, expandRegion.height);
        if (!cropImg) {
            addMsg("裁剪失败");
            img.recycle();
            return null;
        }
        var gray = images.grayscale(cropImg);
        var binary = images.threshold(gray, 100, 255, "BINARY");
        var result = ocr.detect(binary);
        var fullText = "";
        if (result) {
            for (var i = 0; i < result.length; i++) {
                var block = result[i];
                if (block.text) fullText += block.text;
                if (block.children) {
                    for (var j = 0; j < block.children.length; j++) {
                        if (block.children[j].text) fullText += block.children[j].text;
                    }
                }
            }
        }
        binary.recycle();
        gray.recycle();
        cropImg.recycle();
        img.recycle();
        var cleanText = fullText.replace(/[^0-9]/g, "");
        var countNum = parseInt(cleanText);
        if (!isNaN(countNum) && countNum > 0 && countNum < 500) {
            return countNum;
        }
        return detectWithOriginal(region);
    }
    
    function detectWithOriginal(region) {
        var expand = 20;
        var expandRegion = {
            x: region.x - expand,
            y: region.y - expand,
            width: region.width + expand * 2,
            height: region.height + expand * 2
        };
        var img = captureScreen();
        if (!img) return null;
        var cropImg = images.clip(img, expandRegion.x, expandRegion.y, expandRegion.width, expandRegion.height);
        if (!cropImg) {
            img.recycle();
            return null;
        }
        var result = ocr.detect(cropImg);
        var fullText = "";
        if (result) {
            for (var i = 0; i < result.length; i++) {
                var block = result[i];
                if (block.text) fullText += block.text;
                if (block.children) {
                    for (var j = 0; j < block.children.length; j++) {
                        if (block.children[j].text) fullText += block.children[j].text;
                    }
                }
            }
        }
        cropImg.recycle();
        img.recycle();
        var cleanText = fullText.replace(/[^0-9]/g, "");
        var countNum = parseInt(cleanText);
        if (!isNaN(countNum) && countNum > 0 && countNum < 500) {
            return countNum;
        }
        return null;
    }
    
    function clickGift(targetName) {
        var btns = text("赠送").find();
        if (btns.length < 3) {
            addMsg("只找到 " + btns.length + " 个赠送按钮");
            return false;
        }
        btns.sort(function(a, b) {
            return a.bounds().centerY() - b.bounds().centerY();
        });
        var map = {
            "能量双击卡": btns[0],
            "能量保护罩": btns[1],
            "时光加速器": btns[2]
        };
        var target = map[targetName];
        if (target) {
            target.click();
            addMsg("已点击" + targetName + "赠送");
            return true;
        }
        return false;
    }
    
    function isConfirmDialogVisible() {
        var cancelBtn = text("取消").findOne(200);
        if (cancelBtn) return true;
        return false;
    }
    
    function clickConfirmGift() {
        var clickX = confirmGiftRegion.x + confirmGiftRegion.width / 2;
        var clickY = confirmGiftRegion.y + confirmGiftRegion.height / 2;
        click(clickX, clickY);
        addMsg("已点击确认赠送");
        return true;
    }
    
    function waitForCountChange(beforeCount, timeout) {
        if (timeout === undefined) timeout = 5000;
        var startTime = Date.now();
        var afterCount = beforeCount;
        while (Date.now() - startTime < timeout) {
            var newCount = getCurrentCount(selectedItem);
            if (newCount == null) {
                sleep(300);
                continue;
            }
            afterCount = newCount;
            if (afterCount < beforeCount) {
                addMsg("✅ 数量变化: " + beforeCount + " → " + afterCount + " (减少" + (beforeCount - afterCount) + "个)");
                return true;
            }
            sleep(500);
        }
        addMsg("⚠️ 等待超时，数量未变化");
        return false;
    }
    
    //==============================
    // 主任务
    //==============================
    
    addMsg("开始执行任务");
    addMsg("道具: " + selectedItem + " 目标赠送: " + count + "个");
    sleep(1000);
    
    var currentNum = getCurrentCount(selectedItem);
    initialCount = currentNum;
    targetCount = initialCount - count;
    sentCount = 0;
    updateInfo();
    
    if (currentNum == null) {
        addMsg("⚠️ 无法读取库存，请检查页面");
        ocr.release();
        exit();
    }
    
    if (currentNum < count) {
        addMsg("⚠️ 库存不足 当前" + currentNum + "个，需要" + count + "个");
        ocr.release();
        exit();
    }
    
    addMsg("✅ 库存充足 开始赠送");
    var success = 0;
    var targetNum = currentNum - count;
    addMsg("目标剩余: " + targetNum + "个");
    
    while (true) {
        while (isPause) {
            sleep(500);
            if (isStop) exit();
        }
        if (isStop) break;
        
        var nowNum = getCurrentCount(selectedItem);
        if (nowNum == null) {
            addMsg("⚠️ 检测失败，继续重试");
            sleep(2000);
            continue;
        }
        if (nowNum <= targetNum) {
            addMsg("🎉 达到目标");
            break;
        }
        addMsg("准备赠送第" + (success + 1) + "个，当前: " + nowNum + "个");
        sleep(1000);
        if (!clickGift(selectedItem)) {
            addMsg("⚠️ 点击赠送失败，重试");
            sleep(2000);
            continue;
        }
        sleep(1500);
        var confirmRetry = 0;
        while (!isConfirmDialogVisible() && confirmRetry < 5) {
            addMsg("等待确认框出现...");
            sleep(500);
            confirmRetry++;
        }
        if (!isConfirmDialogVisible()) {
            addMsg("⚠️ 确认框未出现");
            sleep(2000);
            continue;
        }
        addMsg("确认框已出现");
        sleep(500);
        clickConfirmGift();
        sleep(1500);
        addMsg("等待数量变化...");
        if (waitForCountChange(nowNum, 5000)) {
            success++;
            sentCount = success;
            updateInfo();
            addMsg("✅ 赠送成功 " + success + " 个");
            sleep(1000);
        } else {
            addMsg("⚠️ 赠送失败，继续重试");
            sleep(1500);
            continue;
        }
        sleep(1500);
    }
    
    addMsg("🎉 赠送完成");
    sleep(2000);
    var last = getCurrentCount(selectedItem);
    if (last != null) {
        addMsg("最终剩余: " + last + "个");
    } else {
        addMsg("⚠️ 无法读取最终数量");
    }
    ocr.release();
    setInterval(function() {}, 1000);
}

// ===== 启动流程：先检测更新，再启动主程序 =====
checkUpdate(startMain);
