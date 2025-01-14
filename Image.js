const PNG = require('upng-js');
const fs = require('fs');
const JPG = require('jpeg-js')
class Image {
    width = 0;
    height = 0;
    imageData = null;
    static Left = 0;
    static Right = 1;
    static Top = 2;
    static Bottom = 3;
    static Len = 10;
    static ocrData = null;
    constructor(image_data) {
        if (image_data.base64 !== undefined) {
            this.imageData = this._getImageData(image_data)
        } else if (image_data.data !== undefined) {
            this.imageData = image_data.data;
            this.width = image_data.width;
            this.height = image_data.height;
        } else if (image_data.color !== undefined) {
            if (image_data.color.length !== 4 || image_data.width <= 0 || image_data.height <= 0) throw new Error("参数错误")
            this.width = image_data.width;
            this.height = image_data.height;
            this.imageData = this._getFillImageData(image_data.color)
        } else if (image_data.path !== undefined) {
            this.imageData = this._getImageData({
                base64: fs.readFileSync(image_data.path).toString('base64')
            })
        } else if (image_data.copy !== undefined) {
            this.imageData = image_data.copy
            this.width = image_data.width;
            this.height = image_data.height;
        } else {
            throw new Error("参数错误")
        }
    }
    rep(img, x, y) {
        if (x + img.width > this.width || y + img.height > this.height || x < 0 || y < 0) throw new Error("参数错误")
        for (let i = 0; i < img.height; i++) {
            for (let j = 0; j < img.width; j++) {
                const sourceIndex = (i * img.width + j) * 4;
                const targetIndex = ((y + i) * this.width + (x + j)) * 4;
                this.imageData[targetIndex] = img.imageData[sourceIndex];
                this.imageData[targetIndex + 1] = img.imageData[sourceIndex + 1];
                this.imageData[targetIndex + 2] = img.imageData[sourceIndex + 2];
                this.imageData[targetIndex + 3] = img.imageData[sourceIndex + 3];
            }
        }
    }
    sub(img, x, y) {
        if (x + img.width > this.width || y + img.height > this.height || x < 0 || y < 0) throw new Error("参数错误")
        for (let i = 0; i < img.height; i++) {
            for (let j = 0; j < img.width; j++) {
                const sourceIndex = (i * img.width + j) * 4;
                const targetIndex = ((y + i) * this.width + (x + j)) * 4;
                this.imageData[targetIndex] = this.imageData[targetIndex] - img.imageData[sourceIndex];
                this.imageData[targetIndex + 1] = this.imageData[targetIndex + 1] - img.imageData[sourceIndex + 1];
                this.imageData[targetIndex + 2] = this.imageData[targetIndex + 2] - img.imageData[sourceIndex + 2];
            }
        }
    }
    add(img, x, y) {
        if (x + img.width > this.width || y + img.height > this.height || x < 0 || y < 0) throw new Error("参数错误")
        for (let i = 0; i < img.height; i++) {
            for (let j = 0; j < img.width; j++) {
                const sourceIndex = (i * img.width + j) * 4;
                const targetIndex = ((y + i) * this.width + (x + j)) * 4;
                this.imageData[targetIndex] = this.imageData[targetIndex] + img.imageData[sourceIndex];
                this.imageData[targetIndex + 1] = this.imageData[targetIndex + 1] + img.imageData[sourceIndex + 1];
                this.imageData[targetIndex + 2] = this.imageData[targetIndex + 2] + img.imageData[sourceIndex + 2];
            }
        }
    }
    rotateImage(rotationDirection = true) {
        const { width, height, imageData } = this;

        // 创建一个新的 imageData 来存放旋转后的图像
        const newImageData = new Uint8ClampedArray(imageData.length);

        // 旋转 90 度
        if (rotationDirection) {
            // 左旋转（逆时针 90°）
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const oldIndex = (y * width + x) * 4;
                    const newIndex = ((width - x - 1) * height + y) * 4;

                    // 将原图像的像素值拷贝到新位置
                    newImageData[newIndex] = imageData[oldIndex];
                    newImageData[newIndex + 1] = imageData[oldIndex + 1];
                    newImageData[newIndex + 2] = imageData[oldIndex + 2];
                    newImageData[newIndex + 3] = imageData[oldIndex + 3];
                }
            }
        } else {
            // 右旋转（顺时针 90°）
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const oldIndex = (y * width + x) * 4;
                    const newIndex = ((x) * height + (height - y - 1)) * 4;

                    // 将原图像的像素值拷贝到新位置
                    newImageData[newIndex] = imageData[oldIndex];
                    newImageData[newIndex + 1] = imageData[oldIndex + 1];
                    newImageData[newIndex + 2] = imageData[oldIndex + 2];
                    newImageData[newIndex + 3] = imageData[oldIndex + 3];
                }
            }
        }

        // 更新 imageData 为新的旋转后的图像数据
        this.imageData = newImageData;
        // 更新 width 和 height 以适应旋转后的尺寸
        this.width = height;
        this.height = width;
    }
    flipImage(flipDirection = true) {
        const { width, height, imageData } = this;

        // 创建一个新的 imageData 来存放镜像反转后的图像
        const newImageData = new Uint8ClampedArray(imageData.length);

        if (flipDirection) {
            // 水平镜像反转
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const oldIndex = (y * width + x) * 4;
                    const newIndex = (y * width + (width - x - 1)) * 4;

                    // 将原图像的像素值拷贝到新位置
                    newImageData[newIndex] = imageData[oldIndex];
                    newImageData[newIndex + 1] = imageData[oldIndex + 1];
                    newImageData[newIndex + 2] = imageData[oldIndex + 2];
                    newImageData[newIndex + 3] = imageData[oldIndex + 3];
                }
            }
        } else {
            // 垂直镜像反转
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const oldIndex = (y * width + x) * 4;
                    const newIndex = ((height - y - 1) * width + x) * 4;

                    // 将原图像的像素值拷贝到新位置
                    newImageData[newIndex] = imageData[oldIndex];
                    newImageData[newIndex + 1] = imageData[oldIndex + 1];
                    newImageData[newIndex + 2] = imageData[oldIndex + 2];
                    newImageData[newIndex + 3] = imageData[oldIndex + 3];
                }
            }
        }

        // 更新 imageData 为新的镜像反转后的图像数据
        this.imageData = newImageData;
    }
    histogramEqualization() {
        // 1. 计算图像的直方图
        const hist = new Array(256).fill(0);
        const { imageData } = this;

        // 遍历所有像素，计算每个灰度值的出现频率
        for (let i = 0; i < imageData.length; i += 4) {
            const gray = imageData[i]; // 图像已是灰度图，直接取红色通道值
            hist[gray]++;
        }

        // 2. 计算累计分布函数（CDF）
        const cdf = new Array(256).fill(0);
        cdf[0] = hist[0];
        for (let i = 1; i < 256; i++) {
            cdf[i] = cdf[i - 1] + hist[i];
        }

        // 3. 归一化 CDF
        const totalPixels = imageData.length / 4;
        const cdfMin = Math.min(...cdf.filter(val => val > 0)); // 找到非零的最小值
        const cdfMax = cdf[255]; // 最大累计值

        // 4. 对图像进行均衡化处理
        for (let i = 0; i < imageData.length; i += 4) {
            const gray = imageData[i];
            const newGray = Math.floor(((cdf[gray] - cdfMin) / (cdfMax - cdfMin)) * 255);
            imageData[i] = newGray;
            imageData[i + 1] = newGray;
            imageData[i + 2] = newGray;
        }
    }
    findContours(mode = false) {
        const width = this.width;
        const height = this.height;
        const imageData = this.imageData;
        let contours = [];
        let visited = new Array(width * height).fill(false);
        // 定义方向，顺时针方向查找轮廓
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 1, dy: 0 },  // 右
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 } , // 左
            { dx: -1, dy: -1 }, // 左上
            { dx: 1, dy: -1 },  // 右上
            { dx: -1, dy: 1 },  // 左下
            { dx: 1, dy: 1 }   // 右下
        ];
        // 检查像素点是否在图像范围内
        function isValid(x, y) {
            return x >= 0 && x < width && y >= 0 && y < height;
        }
        // 按顺序查找轮廓点
        function findContourStart() {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let index = y * width + x;
                    if (!visited[index] && isContourPixel(x, y)) {
                        return { x: x, y: y };
                    }
                }
            }
            return null;
        }
        // 检查像素点是否为轮廓点
        function isContourPixel(x, y) {
            let index = (y * width + x) * 4;
            return imageData[index] === 255 && imageData[index + 1] === 255 &&
                imageData[index + 2] === 255 && imageData[index + 3] === 255;
        }
        // 开始查找轮廓
        function traceContour(startX, startY) {
            let contour = [];
            let currentX = startX;
            let currentY = startY;
            while (true) {
                let foundNext = false;
                visited[currentY * width + currentX] = true;
                for (let i = 0; i < directions.length; i++) {
                    let nextX = currentX + directions[i].dx;
                    let nextY = currentY + directions[i].dy;
                    if (isValid(nextX, nextY) && !visited[nextY * width + nextX] &&
                        isContourPixel(nextX, nextY)) {
                        currentX = nextX;
                        currentY = nextY;
                        foundNext = true;
                        contour.push({ x: currentX, y: currentY });
                        break;
                    }
                }
                if (!foundNext) break;
            }
            return contour;
        }
        function bfsContour(startX, startY) {
            let contour = [];
            let queue = [{ x: startX, y: startY }];
            while (queue.length > 0) {
                let current = queue.shift();
                let x = current.x;
                let y = current.y;
                if (!visited[y * width + x] && isContourPixel(x, y)) {
                    visited[y * width + x] = true;
                    contour.push(current);
                    // 将所有未访问的邻接轮廓点加入队列
                    for (let i = 0; i < directions.length; i++) {
                        let nextX = x + directions[i].dx;
                        let nextY = y + directions[i].dy;
                        if (isValid(nextX, nextY) && !visited[nextY * width + nextX]) {
                            queue.push({ x: nextX, y: nextY });
                        }
                    }
                }
            }
            return contour;
        }
        // 找出所有轮廓
        let startPoint = findContourStart();
        while (startPoint !== null) {
            let contour = mode?bfsContour(startPoint.x, startPoint.y):traceContour(startPoint.x, startPoint.y);
            if (contour.length > 1) {
                if(mode) contours.push(Image._sortContourClockwise(contour));
                else contours.push(contour);
            }
            startPoint = findContourStart();
        }
        return contours;
    }
    canny(threshold1, threshold2) {
        const thisWidth = this.width;
        const thisHeight = this.height;
        const thisImageData = this.imageData;
        const outputImageData = new Uint8ClampedArray(thisImageData.length);
        // Step 1: 灰度化
        const grayImage = new Uint8ClampedArray(thisWidth * thisHeight);
        for (let i = 0; i < thisWidth * thisHeight; i++) {
            const r = thisImageData[i * 4];
            const g = thisImageData[i * 4 + 1];
            const b = thisImageData[i * 4 + 2];
            grayImage[i] = Math.floor(r * 0.299 + g * 0.587 + b * 0.114);
        }

        // Step 2: 高斯模糊（3x3）
        const gaussianKernel = [
            [1, 2, 1],
            [2, 4, 2],
            [1, 2, 1]
        ];
        const blurredImage = new Uint8ClampedArray(thisWidth * thisHeight);

        for (let y = 1; y < thisHeight - 1; y++) {
            for (let x = 1; x < thisWidth - 1; x++) {
                let sum = 0;
                let weightSum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixel = grayImage[(y + ky) * thisWidth + (x + kx)];
                        const weight = gaussianKernel[ky + 1][kx + 1];
                        sum += pixel * weight;
                        weightSum += weight;
                    }
                }
                blurredImage[y * thisWidth + x] = sum / weightSum;
            }
        }

        // Step 3: 计算梯度和方向
        const gradientMagnitude = new Float32Array(thisWidth * thisHeight);
        const gradientDirection = new Float32Array(thisWidth * thisHeight);

        const sobelX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        const sobelY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];

        for (let y = 1; y < thisHeight - 1; y++) {
            for (let x = 1; x < thisWidth - 1; x++) {
                let gradX = 0;
                let gradY = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixel = blurredImage[(y + ky) * thisWidth + (x + kx)];
                        gradX += pixel * sobelX[ky + 1][kx + 1];
                        gradY += pixel * sobelY[ky + 1][kx + 1];
                    }
                }
                const magnitude = Math.sqrt(gradX * gradX + gradY * gradY);
                const direction = Math.atan2(gradY, gradX);

                gradientMagnitude[y * thisWidth + x] = magnitude;
                gradientDirection[y * thisWidth + x] = direction;
            }
        }

        // Step 4: 非极大值抑制
        const suppressedImage = new Uint8ClampedArray(thisWidth * thisHeight);

        for (let y = 1; y < thisHeight - 1; y++) {
            for (let x = 1; x < thisWidth - 1; x++) {
                const magnitude = gradientMagnitude[y * thisWidth + x];
                const direction = gradientDirection[y * thisWidth + x];

                let neighbor1 = 0;
                let neighbor2 = 0;

                // 判断方向，并取相应的邻居点
                if ((-Math.PI / 8 <= direction && direction < Math.PI / 8) ||
                    (7 * Math.PI / 8 <= direction && direction <= Math.PI) ||
                    (-Math.PI <= direction && direction < -7 * Math.PI / 8)) {
                    neighbor1 = gradientMagnitude[y * thisWidth + (x + 1)];
                    neighbor2 = gradientMagnitude[y * thisWidth + (x - 1)];
                } else if ((Math.PI / 8 <= direction && direction < 3 * Math.PI / 8) ||
                    (-7 * Math.PI / 8 < direction && direction <= -5 * Math.PI / 8)) {
                    neighbor1 = gradientMagnitude[(y + 1) * thisWidth + (x + 1)];
                    neighbor2 = gradientMagnitude[(y - 1) * thisWidth + (x - 1)];
                } else if ((3 * Math.PI / 8 <= direction && direction < 5 * Math.PI / 8) ||
                    (-5 * Math.PI / 8 < direction && direction <= -3 * Math.PI / 8)) {
                    neighbor1 = gradientMagnitude[(y + 1) * thisWidth + x];
                    neighbor2 = gradientMagnitude[(y - 1) * thisWidth + x];
                } else if ((5 * Math.PI / 8 <= direction && direction < 7 * Math.PI / 8) ||
                    (-3 * Math.PI / 8 < direction && direction <= -Math.PI / 8)) {
                    neighbor1 = gradientMagnitude[(y + 1) * thisWidth + (x - 1)];
                    neighbor2 = gradientMagnitude[(y - 1) * thisWidth + (x + 1)];
                }

                if (magnitude >= neighbor1 && magnitude >= neighbor2) {
                    suppressedImage[y * thisWidth + x] = magnitude;
                } else {
                    suppressedImage[y * thisWidth + x] = 0;
                }
            }
        }

        // Step 5: 双阈值检测和边缘连接
        for (let y = 2; y < thisHeight - 2; y++) {
            for (let x = 2; x < thisWidth - 2; x++) {
                const magnitude = suppressedImage[y * thisWidth + x];
                if (magnitude >= threshold2) {
                    outputImageData[(y * thisWidth + x) * 4] = 255;     // R
                    outputImageData[(y * thisWidth + x) * 4 + 1] = 255; // G
                    outputImageData[(y * thisWidth + x) * 4 + 2] = 255; // B
                    outputImageData[(y * thisWidth + x) * 4 + 3] = 255; // A
                } else if (magnitude >= threshold1) {
                    // 连接至更强的边缘点
                    let connected = false;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            if (suppressedImage[(y + ky) * thisWidth + (x + kx)] >= threshold2) {
                                connected = true;
                                break;
                            }
                        }
                        if (connected) break;
                    }
                    if (connected) {
                        outputImageData[(y * thisWidth + x) * 4] = 255;
                        outputImageData[(y * thisWidth + x) * 4 + 1] = 255;
                        outputImageData[(y * thisWidth + x) * 4 + 2] = 255;
                        outputImageData[(y * thisWidth + x) * 4 + 3] = 255;
                    } else {
                        outputImageData[(y * thisWidth + x) * 4] = 0;
                        outputImageData[(y * thisWidth + x) * 4 + 1] = 0;
                        outputImageData[(y * thisWidth + x) * 4 + 2] = 0;
                        outputImageData[(y * thisWidth + x) * 4 + 3] = 255;
                    }
                } else {
                    outputImageData[(y * thisWidth + x) * 4] = 0;
                    outputImageData[(y * thisWidth + x) * 4 + 1] = 0;
                    outputImageData[(y * thisWidth + x) * 4 + 2] = 0;
                    outputImageData[(y * thisWidth + x) * 4 + 3] = 255;
                }
            }
        }
        const fill = () =>{
            for (let i = 0; i < 2; i++){
                for (let j = 0; j < thisWidth; j++){
                    let index_top = i * thisWidth * 4 + j * 4;
                    outputImageData[index_top] = 0;
                    outputImageData[index_top + 1] = 0;
                    outputImageData[index_top + 2] = 0;
                    outputImageData[index_top + 3] = 255;
                    let index_bottom = (thisHeight - i - 1) * thisWidth * 4 + j * 4;
                    outputImageData[index_bottom] = 0;
                    outputImageData[index_bottom + 1] = 0;
                    outputImageData[index_bottom + 2] = 0;
                    outputImageData[index_bottom + 3] = 255;
                }
            }
            for (let i = 0; i < 2; i++){
                for (let j = 0; j < thisHeight; j++){
                    let index_left = j * thisWidth * 4 + i * 4;
                    outputImageData[index_left] = 0;
                    outputImageData[index_left + 1] = 0;
                    outputImageData[index_left + 2] = 0;
                    outputImageData[index_left + 3] = 255;
                    let index_right = j * thisWidth * 4 + (thisWidth - i - 1) * 4;
                    outputImageData[index_right] = 0;
                    outputImageData[index_right + 1] = 0;
                    outputImageData[index_right + 2] = 0;
                    outputImageData[index_right + 3] = 255;
                }
            }
        }
        fill();
        this.imageData = null;
        this.imageData = outputImageData;
    }

    matchTemplate(img) {
        if (img.width >= this.width || img.height >= this.height) {
            throw new Error("参数错误");
        }
        const imgWidth = img.width;
        const imgHeight = img.height;
        const thisWidth = this.width;
        const thisHeight = this.height;
        // 创建积分图
        const imgIntegral = new Array(imgWidth * imgHeight).fill(0);
        const thisIntegral = new Array(thisWidth * thisHeight).fill(0);
        for (let y = 0; y < imgHeight; y++) {
            for (let x = 0; x < imgWidth; x++) {
                const i = y * imgWidth + x;
                const gray = Math.floor(
                    img.imageData[i * 4] * 0.299 +
                    img.imageData[i * 4 + 1] * 0.587 +
                    img.imageData[i * 4 + 2] * 0.114
                );
                const above = y > 0 ? imgIntegral[i - imgWidth] : 0;
                const left = x > 0 ? imgIntegral[i - 1] : 0;
                const aboveLeft = (y > 0 && x > 0) ? imgIntegral[i - imgWidth - 1] : 0;
                imgIntegral[i] = gray * gray + above + left - aboveLeft;
            }
        }
        for (let y = 0; y < thisHeight; y++) {
            for (let x = 0; x < thisWidth; x++) {
                const i = y * thisWidth + x;
                const gray = Math.floor(
                    this.imageData[i * 4] * 0.299 +
                    this.imageData[i * 4 + 1] * 0.587 +
                    this.imageData[i * 4 + 2] * 0.114
                );
                const above = y > 0 ? thisIntegral[i - thisWidth] : 0;
                const left = x > 0 ? thisIntegral[i - 1] : 0;
                const aboveLeft = (y > 0 && x > 0) ? thisIntegral[i - thisWidth - 1] : 0;
                thisIntegral[i] = gray * gray + above + left - aboveLeft;
            }
        }
        let result = { x: 0, y: 0, score: -Infinity };
        for (let i = 0; i <= thisHeight - imgHeight; i++) {
            for (let j = 0; j <= thisWidth - imgWidth; j++) {
                const A = j > 0 && i > 0 ? thisIntegral[(i - 1) * thisWidth + (j - 1)] : 0;
                const B = i > 0 ? thisIntegral[(i - 1) * thisWidth + (j + imgWidth - 1)] : 0;
                const C = j > 0 ? thisIntegral[(i + imgHeight - 1) * thisWidth + (j - 1)] : 0;
                const D = thisIntegral[(i + imgHeight - 1) * thisWidth + (j + imgWidth - 1)];
                const imgSum = imgIntegral[imgWidth * imgHeight - 1];
                const thisSum = D - B - C + A;
                const diff = thisSum - imgSum;
                const score = -Math.sqrt(Math.abs(diff));
                if (score > result.score) {
                    result.x = j;
                    result.y = i;
                    result.score = score;
                }
            }
        }
        return result;
    }

    rectangle(x, y, width, height, color = [255, 0, 0, 255], lineWidth = 3) {
        if (x + width > this.width || y + height > this.height || x < 0 || y < 0 || width <= 0 || height <= 0 || lineWidth <= 0) throw new Error("参数错误")
        const drawPixel = (x, y, color) => {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                const index = (y * this.width + x) * 4;
                this.imageData[index] = color[0];
                this.imageData[index + 1] = color[1];
                this.imageData[index + 2] = color[2];
                this.imageData[index + 3] = color[3];
            }
        }
        for (let lineOffset = 0; lineOffset < lineWidth; lineOffset++) {
            for (let j = x + lineOffset; j < x + width - lineOffset; j++) { drawPixel(j, y + lineOffset, color); }
            for (let j = x + lineOffset; j < x + width - lineOffset; j++) { drawPixel(j, y + height - 1 - lineOffset, color); }
            for (let j = y + lineOffset; j < y + height - lineOffset; j++) { drawPixel(x + lineOffset, j, color); }
            for (let j = y + lineOffset; j < y + height - lineOffset; j++) { drawPixel(x + width - 1 - lineOffset, j, color); }
        }
    }
    concat(img, direction = Image.Right) {
        if (direction === Image.Right || direction === Image.Left) {
            if (img.height === this.height) {
                const newWidth = this.width + img.width;
                const newHeight = this.height;
                const newImageData = new Uint8ClampedArray(newWidth * newHeight * 4);
                for (let i = 0; i < this.height; i++) {
                    for (let j = 0; j < this.width; j++) {
                        const sourceIndex = (i * this.width + j) * 4;
                        const targetIndex = (i * newWidth + j + (direction === Image.Left ? img.width : 0)) * 4;
                        newImageData[targetIndex] = this.imageData[sourceIndex];
                        newImageData[targetIndex + 1] = this.imageData[sourceIndex + 1];
                        newImageData[targetIndex + 2] = this.imageData[sourceIndex + 2];
                        newImageData[targetIndex + 3] = this.imageData[sourceIndex + 3];
                    }
                }
                for (let i = 0; i < img.height; i++) {
                    for (let j = 0; j < img.width; j++) {
                        const sourceIndex = (i * img.width + j) * 4;
                        const targetIndex = (i * newWidth + j + (direction === Image.Right ? this.width : 0)) * 4;
                        newImageData[targetIndex] = img.imageData[sourceIndex];
                        newImageData[targetIndex + 1] = img.imageData[sourceIndex + 1];
                        newImageData[targetIndex + 2] = img.imageData[sourceIndex + 2];
                        newImageData[targetIndex + 3] = img.imageData[sourceIndex + 3];
                    }
                }
                this.imageData = newImageData
                this.width = newWidth;
                this.height = newHeight;

            } else {
                throw new Error("图片高度不匹配")
            }
        } else if (direction === Image.Top || direction === Image.Bottom) {
            if (img.width === this.width) {
                const newWidth = this.width;
                const newHeight = this.height + img.height;
                const newImageData = new Uint8ClampedArray(newWidth * newHeight * 4);
                for (let i = 0; i < this.height; i++) {
                    for (let j = 0; j < this.width; j++) {
                        const sourceIndex = (i * this.width + j) * 4;
                        const targetIndex = ((i + (direction === Image.Bottom ? this.height : 0)) * newWidth + j) * 4;
                        newImageData[targetIndex] = this.imageData[sourceIndex];
                        newImageData[targetIndex + 1] = this.imageData[sourceIndex + 1];
                        newImageData[targetIndex + 2] = this.imageData[sourceIndex + 2];
                        newImageData[targetIndex + 3] = this.imageData[sourceIndex + 3];
                    }
                }
                for (let i = 0; i < img.height; i++) {
                    for (let j = 0; j < img.width; j++) {
                        const sourceIndex = (i * img.width + j) * 4;
                        const targetIndex = ((i + (direction === Image.Bottom ? 0 : this.height)) * newWidth + j) * 4;
                        newImageData[targetIndex] = img.imageData[sourceIndex];
                        newImageData[targetIndex + 1] = img.imageData[sourceIndex + 1];
                        newImageData[targetIndex + 2] = img.imageData[sourceIndex + 2];
                        newImageData[targetIndex + 3] = img.imageData[sourceIndex + 3];
                    }
                }
                this.imageData = newImageData
                this.width = newWidth;
                this.height = newHeight;
            } else {
                throw new Error("图片宽度不匹配")
            }
        }
        else throw new Error("参数错误")
    }
    slice(x, y, width, height) {
        if (x + width > this.width || y + height > this.height || x < 0 || y < 0 || width <= 0 || height <= 0) throw new Error("参数错误")
        const byteCount = width * height * 4;
        const croppedData = new Uint8ClampedArray(byteCount);
        const sourceStartIndex = (y * this.width + x) * 4;
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const sourceIndex = sourceStartIndex + (i * this.width + j) * 4;
                const targetIndex = (i * width + j) * 4;
                croppedData[targetIndex] = this.imageData[sourceIndex];
                croppedData[targetIndex + 1] = this.imageData[sourceIndex + 1];
                croppedData[targetIndex + 2] = this.imageData[sourceIndex + 2];
                croppedData[targetIndex + 3] = this.imageData[sourceIndex + 3];
            }
        }
        this.imageData = null;
        this.imageData = croppedData
        this.width = width;
        this.height = height;
    }
    inRange(low, high) {
        for (let i = 0; i < this.imageData.length; i += 4) {
            if (this.imageData[i] >= low[0] && this.imageData[i] <= high[0] && this.imageData[i + 1] >= low[1] && this.imageData[i + 1] <= high[1] && this.imageData[i + 2] >= low[2] && this.imageData[i + 2] <= high[2]) {
                this.imageData[i] = 255;
                this.imageData[i + 1] = 255;
                this.imageData[i + 2] = 255;
            } else {
                this.imageData[i] = 0;
                this.imageData[i + 1] = 0;
                this.imageData[i + 2] = 0;
            }
        }
    }
    cvtHsv() {
        const rgbToHsv = (r, g, b) => {
            r = r / 255;
            g = g / 255;
            b = b / 255;
            let max = Math.max(r, g, b), min = Math.min(r, g, b);
            let delta = max - min;
            let h = 0, s = 0, v = max * 255;
            if (max !== 0) {
                s = (delta / max) * 255;
            }
            if (delta === 0) {
                h = 0;
            } else if (max === r) {
                h = ((g - b) / delta) % 6;
                if (h < 0) h += 6;
            } else if (max === g) {
                h = ((b - r) / delta) + 2;
            } else if (max === b) {
                h = ((r - g) / delta) + 4;
            }
            h = Math.round(h * 60 * (180 / 360));
            s = Math.round(s);
            v = Math.round(v);
            return [h, s, v];
        };
        let length = this.width * this.height * 4;
        for (let i = 0; i < length; i += 4) {
            const [h, s, v] = rgbToHsv(this.imageData[i], this.imageData[i + 1], this.imageData[i + 2]);
            this.imageData[i] = h;
            this.imageData[i + 1] = s;
            this.imageData[i + 2] = v;

        }
    }
    cvtBinary(threshold = 127, invert = false) {
        if (threshold < 0 || threshold > 255) throw new Error("参数错误")
        for (let i = 0; i < this.imageData.length; i += 4) {
            let gray = Math.floor(this.imageData[i] * 0.299 + this.imageData[i + 1] * 0.587 + this.imageData[i + 2] * 0.114);
            if (invert) {
                if (gray < threshold) {
                    this.imageData[i] = 255;
                    this.imageData[i + 1] = 255;
                    this.imageData[i + 2] = 255;
                    this.imageData[i + 3] = 255;
                }
                else {
                    this.imageData[i] = 0;
                    this.imageData[i + 1] = 0;
                    this.imageData[i + 2] = 0;
                    this.imageData[i + 3] = 255;
                }

            }else {
                if (gray >= threshold) {
                    this.imageData[i] = 255;
                    this.imageData[i + 1] = 255;
                    this.imageData[i + 2] = 255;
                    this.imageData[i + 3] = 255;
                }
                else {
                    this.imageData[i] = 0;
                    this.imageData[i + 1] = 0;
                    this.imageData[i + 2] = 0;
                    this.imageData[i + 3] = 255;
                }
            }
        }
    }
    cvtGray() {
        for (let i = 0; i < this.imageData.length; i += 4) {
            let gray = Math.floor(this.imageData[i] * 0.299 + this.imageData[i + 1] * 0.587 + this.imageData[i + 2] * 0.114);
            this.imageData[i] = gray;
            this.imageData[i + 1] = gray;
            this.imageData[i + 2] = gray;
            this.imageData[i + 3] = 255;
        }
    }
    resize(width, height) {
        if (width <= 0 || height <= 0) throw new Error("参数错误")
        const targetSize = width * height * 4;
        const resizedData = new Uint8ClampedArray(targetSize);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const newX = Math.floor(x * (this.width / width));
                const newY = Math.floor(y * (this.height / height));
                const sourceIndex = (newY * this.width + newX) * 4;
                const targetIndex = (y * width + x) * 4;
                resizedData[targetIndex] = this.imageData[sourceIndex];
                resizedData[targetIndex + 1] = this.imageData[sourceIndex + 1];
                resizedData[targetIndex + 2] = this.imageData[sourceIndex + 2];
                resizedData[targetIndex + 3] = this.imageData[sourceIndex + 3];
            }
        }
        this.imageData = null;
        this.imageData = resizedData;
        this.width = width;
        this.height = height;
    }
    _getFillImageData(color) {
        let imageData = new Uint8ClampedArray(this.width * this.height * 4);
        for (let i = 0; i < imageData.length; i += 4) {
            imageData[i] = color[0];
            imageData[i + 1] = color[1];
            imageData[i + 2] = color[2];
            imageData[i + 3] = color[3];
        }
        return imageData;
    }
    _getImageData(image_data) {
        if (image_data.base64.startsWith('iVBORw0KGgo')) {
            let img_info = PNG.decode(Buffer.from(image_data.base64, 'base64'))
            this.width = img_info.width;
            this.height = img_info.height;
            let imageData = PNG.toRGBA8.decodeImage(img_info.data, img_info.width, img_info.height, img_info);
            return new Uint8ClampedArray(imageData.buffer)
        }
        else if (image_data.base64.startsWith('/9j/')) {
            let decode = JPG.decode(Buffer.from(image_data.base64, 'base64'),{useTArray:true,formatAsRGBA:true,tolerantDecoding:true});
            this.width = decode.width;
            this.height = decode.height;
            return new Uint8ClampedArray(decode.data);
        } else {
            throw new Error("仅支持png,jpg类型图片")
        }
    }
    _getOutputSteam(quality) {
        let bufferRawImageData = JPG.encode({width:this.width,height:this.height,data:this.imageData,comments:undefined},quality);
        return bufferRawImageData.data;
        //return PNG.encode([this.imageData.buffer], this.width, this.height, 0);
    }
    write(path,quality = 50) {
        let imageData = this._getOutputSteam(quality);
        fs.writeFileSync(path, imageData);
    }
    toBase64(quality = 50) {
        let imageData = this._getOutputSteam(quality);
        return imageData.toString('base64')
    }
    copy() {
        return new Image({
            copy: this.imageData.slice(),
            width: this.width,
            height: this.height
        })
    }
    drawContours(contours, color = [255, 0, 0, 255], lineWidth = 1) {
        const imageData = this.imageData;
        const width = this.width;
        const height = this.height;

        function setPixel(x_pos, y_pos) {
            const index = (y_pos * width + x_pos) * 4;
            imageData[index] = color[0]; // Red
            imageData[index + 1] = color[1]; // Green
            imageData[index + 2] = color[2]; // Blue
            imageData[index + 3] = color[3]; // Alpha
        }

        function drawLine(startPoint, endPoint, lineWidth) {
            // Extract the coordinates from the points
            let x0 = startPoint.x;
            let y0 = startPoint.y;
            let x1 = endPoint.x;
            let y1 = endPoint.y;

            // Bresenham's line algorithm
            let steep = false;
            if (Math.abs(y1 - y0) > Math.abs(x1 - x0)) {
                // Swap x and y, and set steep to true
                [x0, y0] = [y0, x0];
                [x1, y1] = [y1, x1];
                steep = true;
            }
            if (x0 > x1) {
                // Swap the points to ensure x0 < x1
                [x0, x1] = [x1, x0];
                [y0, y1] = [y1, y0];
            }

            const dx = x1 - x0;
            const dy = Math.abs(y1 - y0);
            let error = dx / 2;
            let y_step = (y0 < y1) ? 1 : -1;
            let y = y0;

            // Calculate the range for the line width
            const lineWidthHalf = Math.floor(lineWidth / 2);
            const lineWidthRange = Array.from({ length: lineWidth }, (_, i) => i - lineWidthHalf);

            // Loop over the line and set the pixels
            for (let x = x0; x <= x1; x++) {
                if (steep) {
                    // If the line is steep, swap x and y
                    for (let y_offset of lineWidthRange) {
                        setPixel(y + y_offset, x);
                    }
                } else {
                    for (let y_offset of lineWidthRange) {
                        setPixel(x, y + y_offset);
                    }
                }
                error -= dy;
                if (error < 0) {
                    y += y_step;
                    error += dx;
                }
            }
        }
        for (let i = 0; i < contours.length; i++) {
            for (let j = 0; j < contours[i].length - 1; j++) {
                drawLine(contours[i][j], contours[i][j + 1], lineWidth);
            }
        }
    }
    _calculateHistogram(distances, min, max, key, total) {
        const histogram = new Array(Image.Len).fill(0);
        const range = max - min || 1;
        for (let i = 0; i < distances.length; i++) {
            const index = Math.min(Math.floor((distances[i][key] - min) / range * Image.Len), Image.Len - 1);
            histogram[index]++;
        }
        for (let i = 0; i < histogram.length; i++) {
            histogram[i] /= total;
        }
        return histogram;
    }
    medianBlur(kernelSize = 3){
        const {width,height,imageData} = this
        const halfKernel = Math.floor(kernelSize / 2);
        const newImageData = new Uint8ClampedArray(imageData.length);
        const getMedian = (values) => {
            values.sort((a, b) => a - b);
            const middle = Math.floor(values.length / 2);
            return values[middle];
        };
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const rValues = [];
                const gValues = [];
                const bValues = [];
                const aValues = [];
                for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                    for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                        const nx = x + kx;
                        const ny = y + ky;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const index = (ny * width + nx) * 4;
                            rValues.push(imageData[index]);
                            gValues.push(imageData[index + 1]);
                            bValues.push(imageData[index + 2]);
                            aValues.push(imageData[index + 3]);
                        }
                    }
                }
                const index = (y * width + x) * 4;
                newImageData[index] = getMedian(rValues);
                newImageData[index + 1] = getMedian(gValues);
                newImageData[index + 2] = getMedian(bValues);
                newImageData[index + 3] = getMedian(aValues);
            }
        }
        this.imageData = null;
        this.imageData = newImageData;
    }
    gaussianBlur(kernelSize = 3, sigma = 1.0){
        const { width, height, imageData } = this;
        const halfKernel = Math.floor(kernelSize / 2);
        const newImageData = new Uint8ClampedArray(imageData.length);

        // 生成高斯核
        const kernel = this._generateGaussianKernel(kernelSize, sigma);

        // 计算加权平均值
        const applyGaussianKernel = (x, y) => {
            let r = 0, g = 0, b = 0, a = 0, weightSum = 0;
            for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                    const nx = x + kx;
                    const ny = y + ky;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const index = (ny * width + nx) * 4;
                        const weight = kernel[ky + halfKernel][kx + halfKernel];
                        r += imageData[index] * weight;
                        g += imageData[index + 1] * weight;
                        b += imageData[index + 2] * weight;
                        a += imageData[index + 3] * weight;
                        weightSum += weight;
                    }
                }
            }
            return [
                r / weightSum,
                g / weightSum,
                b / weightSum,
                a / weightSum
            ];
        };

        // 处理每个像素
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const [r, g, b, a] = applyGaussianKernel(x, y);
                newImageData[index] = r;
                newImageData[index + 1] = g;
                newImageData[index + 2] = b;
                newImageData[index + 3] = a;
            }
        }

        this.imageData = newImageData;
    }

// 生成高斯核
    _generateGaussianKernel(size, sigma) {
        const kernel = [];
        const halfSize = Math.floor(size / 2);
        const factor = 1 / (2 * Math.PI * sigma * sigma);
        const expFactor = -1 / (2 * sigma * sigma);

        for (let y = -halfSize; y <= halfSize; y++) {
            const row = [];
            for (let x = -halfSize; x <= halfSize; x++) {
                const value = factor * Math.exp((x * x + y * y) * expFactor);
                row.push(value);
            }
            kernel.push(row);
        }

        return kernel;
    }
    dilate(kernelSize = 3){
        const { width, height, imageData } = this;
        const halfKernel = Math.floor(kernelSize / 2);
        const newImageData = new Uint8ClampedArray(imageData.length);

        // 生成一个简单的核（这里我们使用的是全1的矩阵）
        const kernel = this._generateStructuringElement(kernelSize);

        // 进行膨胀操作
        const applyDilation = (x, y) => {
            let r = 0, g = 0, b = 0, a = 0;
            for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                    const nx = x + kx;
                    const ny = y + ky;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const index = (ny * width + nx) * 4;
                        if (kernel[ky + halfKernel][kx + halfKernel] === 1) {
                            r = Math.max(r, imageData[index]);
                            g = Math.max(g, imageData[index + 1]);
                            b = Math.max(b, imageData[index + 2]);
                            a = Math.max(a, imageData[index + 3]);
                        }
                    }
                }
            }
            return [r, g, b, a];
        };

        // 遍历每个像素进行膨胀处理
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const [r, g, b, a] = applyDilation(x, y);
                newImageData[index] = r;
                newImageData[index + 1] = g;
                newImageData[index + 2] = b;
                newImageData[index + 3] = a;
            }
        }

        this.imageData = newImageData;
    }

// 腐蚀操作
    erode(kernelSize = 3){
        const { width, height, imageData } = this;
        const halfKernel = Math.floor(kernelSize / 2);
        const newImageData = new Uint8ClampedArray(imageData.length);

        // 生成一个简单的核（这里我们使用的是全1的矩阵）
        const kernel = this._generateStructuringElement(kernelSize);

        // 进行腐蚀操作
        const applyErosion = (x, y) => {
            let r = 255, g = 255, b = 255, a = 255; // 假设初始为最大值
            for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                    const nx = x + kx;
                    const ny = y + ky;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const index = (ny * width + nx) * 4;
                        if (kernel[ky + halfKernel][kx + halfKernel] === 1) {
                            r = Math.min(r, imageData[index]);
                            g = Math.min(g, imageData[index + 1]);
                            b = Math.min(b, imageData[index + 2]);
                            a = Math.min(a, imageData[index + 3]);
                        }
                    }
                }
            }
            return [r, g, b, a];
        };

        // 遍历每个像素进行腐蚀处理
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const [r, g, b, a] = applyErosion(x, y);
                newImageData[index] = r;
                newImageData[index + 1] = g;
                newImageData[index + 2] = b;
                newImageData[index + 3] = a;
            }
        }

        this.imageData = newImageData;
    }

// 生成结构元素（膨胀与腐蚀的卷积核）
    _generateStructuringElement(size) {
        const kernel = [];
        for (let y = 0; y < size; y++) {
            const row = [];
            for (let x = 0; x < size; x++) {
                row.push(1); // 使用全1的结构元素，通常为方形
            }
            kernel.push(row);
        }
        return kernel;
    }

    static contourCenter(contour) {
        let sumX = 0, sumY = 0;
        for (let i = 0; i < contour.length; i++) {
            sumX += contour[i].x;
            sumY += contour[i].y;
        }
        return { x: sumX / contour.length, y: sumY / contour.length };
    }
    static _sortContourClockwise(contour) {
        // 计算轮廓中心点
        const center = Image.contourCenter(contour);
        // 计算每个点的极角并排序
        return contour.slice().sort((a, b) => {
            const angleA = Math.atan2(a.y - center.y, a.x - center.x);
            const angleB = Math.atan2(b.y - center.y, b.x - center.x);
            return angleA - angleB;
        });
    }
    static contourArea(points) {
        let area = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n; // 下一个点索引，循环回到第一个点
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return Math.abs(area / 2);
    }
    static  contourPerimeter(points) {
        function distance(point1, point2) {
            return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
        }
        let perimeter = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n; // 下一个点索引，循环回到第一个点
            perimeter += distance(points[i], points[j]);
        }
        return perimeter;
    }
    static boundingRect(points) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        // 遍历所有点，找到最小和最大的x和y坐标
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        // 构建矩形对象
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Image;
    console.log("Node.js 环境")
} else {
    window.Image = Image;
    console.log("浏览器环境")
}
console.log("当前Image.js版本：1.0.3")
