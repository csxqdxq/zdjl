var btoa = btoa || function(buf) {
    return Buffer.from(buf).toString('base64');
};
function JPEGEncoder(quality) {
    var self = this;
    var fround = Math.round;
    var ffloor = Math.floor;
    var YTable = new Array(64);
    var UVTable = new Array(64);
    var fdtbl_Y = new Array(64);
    var fdtbl_UV = new Array(64);
    var YDC_HT;
    var UVDC_HT;
    var YAC_HT;
    var UVAC_HT;

    var bitcode = new Array(65535);
    var category = new Array(65535);
    var outputfDCTQuant = new Array(64);
    var DU = new Array(64);
    var byteout = [];
    var bytenew = 0;
    var bytepos = 7;

    var YDU = new Array(64);
    var UDU = new Array(64);
    var VDU = new Array(64);
    var clt = new Array(256);
    var RGB_YUV_TABLE = new Array(2048);
    var currentQuality;

    var ZigZag = [
        0, 1, 5, 6,14,15,27,28,
        2, 4, 7,13,16,26,29,42,
        3, 8,12,17,25,30,41,43,
        9,11,18,24,31,40,44,53,
        10,19,23,32,39,45,52,54,
        20,22,33,38,46,51,55,60,
        21,34,37,47,50,56,59,61,
        35,36,48,49,57,58,62,63
    ];

    var std_dc_luminance_nrcodes = [0,0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0];
    var std_dc_luminance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
    var std_ac_luminance_nrcodes = [0,0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,0x7d];
    var std_ac_luminance_values = [
        0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,
        0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
        0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,
        0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
        0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,
        0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
        0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,
        0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
        0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
        0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
        0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,
        0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
        0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,
        0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
        0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
        0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
        0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,
        0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
        0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,
        0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
        0xf9,0xfa
    ];

    var std_dc_chrominance_nrcodes = [0,0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0];
    var std_dc_chrominance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
    var std_ac_chrominance_nrcodes = [0,0,2,1,2,4,4,3,4,7,5,4,4,0,1,2,0x77];
    var std_ac_chrominance_values = [
        0x00,0x01,0x02,0x03,0x11,0x04,0x05,0x21,
        0x31,0x06,0x12,0x41,0x51,0x07,0x61,0x71,
        0x13,0x22,0x32,0x81,0x08,0x14,0x42,0x91,
        0xa1,0xb1,0xc1,0x09,0x23,0x33,0x52,0xf0,
        0x15,0x62,0x72,0xd1,0x0a,0x16,0x24,0x34,
        0xe1,0x25,0xf1,0x17,0x18,0x19,0x1a,0x26,
        0x27,0x28,0x29,0x2a,0x35,0x36,0x37,0x38,
        0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,
        0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,
        0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,
        0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,
        0x79,0x7a,0x82,0x83,0x84,0x85,0x86,0x87,
        0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,
        0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,
        0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,
        0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,
        0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xd2,
        0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,
        0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,
        0xea,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
        0xf9,0xfa
    ];

    function initQuantTables(sf){
        var YQT = [
            16, 11, 10, 16, 24, 40, 51, 61,
            12, 12, 14, 19, 26, 58, 60, 55,
            14, 13, 16, 24, 40, 57, 69, 56,
            14, 17, 22, 29, 51, 87, 80, 62,
            18, 22, 37, 56, 68,109,103, 77,
            24, 35, 55, 64, 81,104,113, 92,
            49, 64, 78, 87,103,121,120,101,
            72, 92, 95, 98,112,100,103, 99
        ];

        for (var i = 0; i < 64; i++) {
            var t = ffloor((YQT[i]*sf+50)/100);
            if (t < 1) {
                t = 1;
            } else if (t > 255) {
                t = 255;
            }
            YTable[ZigZag[i]] = t;
        }
        var UVQT = [
            17, 18, 24, 47, 99, 99, 99, 99,
            18, 21, 26, 66, 99, 99, 99, 99,
            24, 26, 56, 99, 99, 99, 99, 99,
            47, 66, 99, 99, 99, 99, 99, 99,
            99, 99, 99, 99, 99, 99, 99, 99,
            99, 99, 99, 99, 99, 99, 99, 99,
            99, 99, 99, 99, 99, 99, 99, 99,
            99, 99, 99, 99, 99, 99, 99, 99
        ];
        for (var j = 0; j < 64; j++) {
            var u = ffloor((UVQT[j]*sf+50)/100);
            if (u < 1) {
                u = 1;
            } else if (u > 255) {
                u = 255;
            }
            UVTable[ZigZag[j]] = u;
        }
        var aasf = [
            1.0, 1.387039845, 1.306562965, 1.175875602,
            1.0, 0.785694958, 0.541196100, 0.275899379
        ];
        var k = 0;
        for (var row = 0; row < 8; row++)
        {
            for (var col = 0; col < 8; col++)
            {
                fdtbl_Y[k]  = (1.0 / (YTable [ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                fdtbl_UV[k] = (1.0 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
                k++;
            }
        }
    }

    function computeHuffmanTbl(nrcodes, std_table){
        var codevalue = 0;
        var pos_in_table = 0;
        var HT = new Array();
        for (var k = 1; k <= 16; k++) {
            for (var j = 1; j <= nrcodes[k]; j++) {
                HT[std_table[pos_in_table]] = [];
                HT[std_table[pos_in_table]][0] = codevalue;
                HT[std_table[pos_in_table]][1] = k;
                pos_in_table++;
                codevalue++;
            }
            codevalue*=2;
        }
        return HT;
    }

    function initHuffmanTbl()
    {
        YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes,std_dc_luminance_values);
        UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes,std_dc_chrominance_values);
        YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes,std_ac_luminance_values);
        UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes,std_ac_chrominance_values);
    }

    function initCategoryNumber()
    {
        var nrlower = 1;
        var nrupper = 2;
        for (var cat = 1; cat <= 15; cat++) {
            //Positive numbers
            for (var nr = nrlower; nr<nrupper; nr++) {
                category[32767+nr] = cat;
                bitcode[32767+nr] = [];
                bitcode[32767+nr][1] = cat;
                bitcode[32767+nr][0] = nr;
            }
            //Negative numbers
            for (var nrneg =-(nrupper-1); nrneg<=-nrlower; nrneg++) {
                category[32767+nrneg] = cat;
                bitcode[32767+nrneg] = [];
                bitcode[32767+nrneg][1] = cat;
                bitcode[32767+nrneg][0] = nrupper-1+nrneg;
            }
            nrlower <<= 1;
            nrupper <<= 1;
        }
    }

    function initRGBYUVTable() {
        for(var i = 0; i < 256;i++) {
            RGB_YUV_TABLE[i]      		=  19595 * i;
            RGB_YUV_TABLE[(i+ 256)>>0] 	=  38470 * i;
            RGB_YUV_TABLE[(i+ 512)>>0] 	=   7471 * i + 0x8000;
            RGB_YUV_TABLE[(i+ 768)>>0] 	= -11059 * i;
            RGB_YUV_TABLE[(i+1024)>>0] 	= -21709 * i;
            RGB_YUV_TABLE[(i+1280)>>0] 	=  32768 * i + 0x807FFF;
            RGB_YUV_TABLE[(i+1536)>>0] 	= -27439 * i;
            RGB_YUV_TABLE[(i+1792)>>0] 	= - 5329 * i;
        }
    }

    // IO functions
    function writeBits(bs)
    {
        var value = bs[0];
        var posval = bs[1]-1;
        while ( posval >= 0 ) {
            if (value & (1 << posval) ) {
                bytenew |= (1 << bytepos);
            }
            posval--;
            bytepos--;
            if (bytepos < 0) {
                if (bytenew == 0xFF) {
                    writeByte(0xFF);
                    writeByte(0);
                }
                else {
                    writeByte(bytenew);
                }
                bytepos=7;
                bytenew=0;
            }
        }
    }

    function writeByte(value)
    {
        //byteout.push(clt[value]); // write char directly instead of converting later
        byteout.push(value);
    }

    function writeWord(value)
    {
        writeByte((value>>8)&0xFF);
        writeByte((value   )&0xFF);
    }

    // DCT & quantization core
    function fDCTQuant(data, fdtbl)
    {
        var d0, d1, d2, d3, d4, d5, d6, d7;
        /* Pass 1: process rows. */
        var dataOff=0;
        var i;
        var I8 = 8;
        var I64 = 64;
        for (i=0; i<I8; ++i)
        {
            d0 = data[dataOff];
            d1 = data[dataOff+1];
            d2 = data[dataOff+2];
            d3 = data[dataOff+3];
            d4 = data[dataOff+4];
            d5 = data[dataOff+5];
            d6 = data[dataOff+6];
            d7 = data[dataOff+7];

            var tmp0 = d0 + d7;
            var tmp7 = d0 - d7;
            var tmp1 = d1 + d6;
            var tmp6 = d1 - d6;
            var tmp2 = d2 + d5;
            var tmp5 = d2 - d5;
            var tmp3 = d3 + d4;
            var tmp4 = d3 - d4;

            /* Even part */
            var tmp10 = tmp0 + tmp3;	/* phase 2 */
            var tmp13 = tmp0 - tmp3;
            var tmp11 = tmp1 + tmp2;
            var tmp12 = tmp1 - tmp2;

            data[dataOff] = tmp10 + tmp11; /* phase 3 */
            data[dataOff+4] = tmp10 - tmp11;

            var z1 = (tmp12 + tmp13) * 0.707106781; /* c4 */
            data[dataOff+2] = tmp13 + z1; /* phase 5 */
            data[dataOff+6] = tmp13 - z1;

            /* Odd part */
            tmp10 = tmp4 + tmp5; /* phase 2 */
            tmp11 = tmp5 + tmp6;
            tmp12 = tmp6 + tmp7;

            /* The rotator is modified from fig 4-8 to avoid extra negations. */
            var z5 = (tmp10 - tmp12) * 0.382683433; /* c6 */
            var z2 = 0.541196100 * tmp10 + z5; /* c2-c6 */
            var z4 = 1.306562965 * tmp12 + z5; /* c2+c6 */
            var z3 = tmp11 * 0.707106781; /* c4 */

            var z11 = tmp7 + z3;	/* phase 5 */
            var z13 = tmp7 - z3;

            data[dataOff+5] = z13 + z2;	/* phase 6 */
            data[dataOff+3] = z13 - z2;
            data[dataOff+1] = z11 + z4;
            data[dataOff+7] = z11 - z4;

            dataOff += 8; /* advance pointer to next row */
        }

        /* Pass 2: process columns. */
        dataOff = 0;
        for (i=0; i<I8; ++i)
        {
            d0 = data[dataOff];
            d1 = data[dataOff + 8];
            d2 = data[dataOff + 16];
            d3 = data[dataOff + 24];
            d4 = data[dataOff + 32];
            d5 = data[dataOff + 40];
            d6 = data[dataOff + 48];
            d7 = data[dataOff + 56];

            var tmp0p2 = d0 + d7;
            var tmp7p2 = d0 - d7;
            var tmp1p2 = d1 + d6;
            var tmp6p2 = d1 - d6;
            var tmp2p2 = d2 + d5;
            var tmp5p2 = d2 - d5;
            var tmp3p2 = d3 + d4;
            var tmp4p2 = d3 - d4;

            /* Even part */
            var tmp10p2 = tmp0p2 + tmp3p2;	/* phase 2 */
            var tmp13p2 = tmp0p2 - tmp3p2;
            var tmp11p2 = tmp1p2 + tmp2p2;
            var tmp12p2 = tmp1p2 - tmp2p2;

            data[dataOff] = tmp10p2 + tmp11p2; /* phase 3 */
            data[dataOff+32] = tmp10p2 - tmp11p2;

            var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781; /* c4 */
            data[dataOff+16] = tmp13p2 + z1p2; /* phase 5 */
            data[dataOff+48] = tmp13p2 - z1p2;

            /* Odd part */
            tmp10p2 = tmp4p2 + tmp5p2; /* phase 2 */
            tmp11p2 = tmp5p2 + tmp6p2;
            tmp12p2 = tmp6p2 + tmp7p2;

            /* The rotator is modified from fig 4-8 to avoid extra negations. */
            var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433; /* c6 */
            var z2p2 = 0.541196100 * tmp10p2 + z5p2; /* c2-c6 */
            var z4p2 = 1.306562965 * tmp12p2 + z5p2; /* c2+c6 */
            var z3p2 = tmp11p2 * 0.707106781; /* c4 */

            var z11p2 = tmp7p2 + z3p2;	/* phase 5 */
            var z13p2 = tmp7p2 - z3p2;

            data[dataOff+40] = z13p2 + z2p2; /* phase 6 */
            data[dataOff+24] = z13p2 - z2p2;
            data[dataOff+ 8] = z11p2 + z4p2;
            data[dataOff+56] = z11p2 - z4p2;

            dataOff++; /* advance pointer to next column */
        }

        // Quantize/descale the coefficients
        var fDCTQuant;
        for (i=0; i<I64; ++i)
        {
            // Apply the quantization and scaling factor & Round to nearest integer
            fDCTQuant = data[i]*fdtbl[i];
            outputfDCTQuant[i] = (fDCTQuant > 0.0) ? ((fDCTQuant + 0.5)|0) : ((fDCTQuant - 0.5)|0);
            //outputfDCTQuant[i] = fround(fDCTQuant);

        }
        return outputfDCTQuant;
    }

    function writeAPP0()
    {
        writeWord(0xFFE0); // marker
        writeWord(16); // length
        writeByte(0x4A); // J
        writeByte(0x46); // F
        writeByte(0x49); // I
        writeByte(0x46); // F
        writeByte(0); // = "JFIF",'\0'
        writeByte(1); // versionhi
        writeByte(1); // versionlo
        writeByte(0); // xyunits
        writeWord(1); // xdensity
        writeWord(1); // ydensity
        writeByte(0); // thumbnwidth
        writeByte(0); // thumbnheight
    }

    function writeAPP1(exifBuffer) {
        if (!exifBuffer) return;

        writeWord(0xFFE1); // APP1 marker

        if (exifBuffer[0] === 0x45 &&
            exifBuffer[1] === 0x78 &&
            exifBuffer[2] === 0x69 &&
            exifBuffer[3] === 0x66) {
            // Buffer already starts with EXIF, just use it directly
            writeWord(exifBuffer.length + 2); // length is buffer + length itself!
        } else {
            // Buffer doesn't start with EXIF, write it for them
            writeWord(exifBuffer.length + 5 + 2); // length is buffer + EXIF\0 + length itself!
            writeByte(0x45); // E
            writeByte(0x78); // X
            writeByte(0x69); // I
            writeByte(0x66); // F
            writeByte(0); // = "EXIF",'\0'
        }

        for (var i = 0; i < exifBuffer.length; i++) {
            writeByte(exifBuffer[i]);
        }
    }

    function writeSOF0(width, height)
    {
        writeWord(0xFFC0); // marker
        writeWord(17);   // length, truecolor YUV JPG
        writeByte(8);    // precision
        writeWord(height);
        writeWord(width);
        writeByte(3);    // nrofcomponents
        writeByte(1);    // IdY
        writeByte(0x11); // HVY
        writeByte(0);    // QTY
        writeByte(2);    // IdU
        writeByte(0x11); // HVU
        writeByte(1);    // QTU
        writeByte(3);    // IdV
        writeByte(0x11); // HVV
        writeByte(1);    // QTV
    }

    function writeDQT()
    {
        writeWord(0xFFDB); // marker
        writeWord(132);	   // length
        writeByte(0);
        for (var i=0; i<64; i++) {
            writeByte(YTable[i]);
        }
        writeByte(1);
        for (var j=0; j<64; j++) {
            writeByte(UVTable[j]);
        }
    }

    function writeDHT()
    {
        writeWord(0xFFC4); // marker
        writeWord(0x01A2); // length

        writeByte(0); // HTYDCinfo
        for (var i=0; i<16; i++) {
            writeByte(std_dc_luminance_nrcodes[i+1]);
        }
        for (var j=0; j<=11; j++) {
            writeByte(std_dc_luminance_values[j]);
        }

        writeByte(0x10); // HTYACinfo
        for (var k=0; k<16; k++) {
            writeByte(std_ac_luminance_nrcodes[k+1]);
        }
        for (var l=0; l<=161; l++) {
            writeByte(std_ac_luminance_values[l]);
        }

        writeByte(1); // HTUDCinfo
        for (var m=0; m<16; m++) {
            writeByte(std_dc_chrominance_nrcodes[m+1]);
        }
        for (var n=0; n<=11; n++) {
            writeByte(std_dc_chrominance_values[n]);
        }

        writeByte(0x11); // HTUACinfo
        for (var o=0; o<16; o++) {
            writeByte(std_ac_chrominance_nrcodes[o+1]);
        }
        for (var p=0; p<=161; p++) {
            writeByte(std_ac_chrominance_values[p]);
        }
    }

    function writeCOM(comments)
    {
        if (typeof comments === "undefined" || comments.constructor !== Array) return;
        comments.forEach(e => {
            if (typeof e !== "string") return;
            writeWord(0xFFFE); // marker
            var l = e.length;
            writeWord(l + 2); // length itself as well
            var i;
            for (i = 0; i < l; i++)
                writeByte(e.charCodeAt(i));
        });
    }

    function writeSOS()
    {
        writeWord(0xFFDA); // marker
        writeWord(12); // length
        writeByte(3); // nrofcomponents
        writeByte(1); // IdY
        writeByte(0); // HTY
        writeByte(2); // IdU
        writeByte(0x11); // HTU
        writeByte(3); // IdV
        writeByte(0x11); // HTV
        writeByte(0); // Ss
        writeByte(0x3f); // Se
        writeByte(0); // Bf
    }

    function processDU(CDU, fdtbl, DC, HTDC, HTAC){
        var EOB = HTAC[0x00];
        var M16zeroes = HTAC[0xF0];
        var pos;
        var I16 = 16;
        var I63 = 63;
        var I64 = 64;
        var DU_DCT = fDCTQuant(CDU, fdtbl);
        //ZigZag reorder
        for (var j=0;j<I64;++j) {
            DU[ZigZag[j]]=DU_DCT[j];
        }
        var Diff = DU[0] - DC; DC = DU[0];
        //Encode DC
        if (Diff==0) {
            writeBits(HTDC[0]); // Diff might be 0
        } else {
            pos = 32767+Diff;
            writeBits(HTDC[category[pos]]);
            writeBits(bitcode[pos]);
        }
        //Encode ACs
        var end0pos = 63; // was const... which is crazy
        for (; (end0pos>0)&&(DU[end0pos]==0); end0pos--) {};
        //end0pos = first element in reverse order !=0
        if ( end0pos == 0) {
            writeBits(EOB);
            return DC;
        }
        var i = 1;
        var lng;
        while ( i <= end0pos ) {
            var startpos = i;
            for (; (DU[i]==0) && (i<=end0pos); ++i) {}
            var nrzeroes = i-startpos;
            if ( nrzeroes >= I16 ) {
                lng = nrzeroes>>4;
                for (var nrmarker=1; nrmarker <= lng; ++nrmarker)
                    writeBits(M16zeroes);
                nrzeroes = nrzeroes&0xF;
            }
            pos = 32767+DU[i];
            writeBits(HTAC[(nrzeroes<<4)+category[pos]]);
            writeBits(bitcode[pos]);
            i++;
        }
        if ( end0pos != I63 ) {
            writeBits(EOB);
        }
        return DC;
    }

    function initCharLookupTable(){
        var sfcc = String.fromCharCode;
        for(var i=0; i < 256; i++){ ///// ACHTUNG // 255
            clt[i] = sfcc(i);
        }
    }

    this.encode = function(image,quality) // image data object
    {
        var time_start = new Date().getTime();

        if(quality) setQuality(quality);

        // Initialize bit writer
        byteout = new Array();
        bytenew=0;
        bytepos=7;

        // Add JPEG headers
        writeWord(0xFFD8); // SOI
        writeAPP0();
        writeCOM(image.comments);
        writeAPP1(image.exifBuffer);
        writeDQT();
        writeSOF0(image.width,image.height);
        writeDHT();
        writeSOS();


        // Encode 8x8 macroblocks
        var DCY=0;
        var DCU=0;
        var DCV=0;

        bytenew=0;
        bytepos=7;


        this.encode.displayName = "_encode_";

        var imageData = image.data;
        var width = image.width;
        var height = image.height;

        var quadWidth = width*4;
        var tripleWidth = width*3;

        var x, y = 0;
        var r, g, b;
        var start,p, col,row,pos;
        while(y < height){
            x = 0;
            while(x < quadWidth){
                start = quadWidth * y + x;
                p = start;
                col = -1;
                row = 0;

                for(pos=0; pos < 64; pos++){
                    row = pos >> 3;// /8
                    col = ( pos & 7 ) * 4; // %8
                    p = start + ( row * quadWidth ) + col;

                    if(y+row >= height){ // padding bottom
                        p-= (quadWidth*(y+1+row-height));
                    }

                    if(x+col >= quadWidth){ // padding right
                        p-= ((x+col) - quadWidth +4)
                    }

                    r = imageData[ p++ ];
                    g = imageData[ p++ ];
                    b = imageData[ p++ ];


                    /* // calculate YUV values dynamically
                    YDU[pos]=((( 0.29900)*r+( 0.58700)*g+( 0.11400)*b))-128; //-0x80
                    UDU[pos]=(((-0.16874)*r+(-0.33126)*g+( 0.50000)*b));
                    VDU[pos]=((( 0.50000)*r+(-0.41869)*g+(-0.08131)*b));
                    */

                    // use lookup table (slightly faster)
                    YDU[pos] = ((RGB_YUV_TABLE[r]             + RGB_YUV_TABLE[(g +  256)>>0] + RGB_YUV_TABLE[(b +  512)>>0]) >> 16)-128;
                    UDU[pos] = ((RGB_YUV_TABLE[(r +  768)>>0] + RGB_YUV_TABLE[(g + 1024)>>0] + RGB_YUV_TABLE[(b + 1280)>>0]) >> 16)-128;
                    VDU[pos] = ((RGB_YUV_TABLE[(r + 1280)>>0] + RGB_YUV_TABLE[(g + 1536)>>0] + RGB_YUV_TABLE[(b + 1792)>>0]) >> 16)-128;

                }

                DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
                DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
                DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
                x+=32;
            }
            y+=8;
        }


        ////////////////////////////////////////////////////////////////

        // Do the bit alignment of the EOI marker
        if ( bytepos >= 0 ) {
            var fillbits = [];
            fillbits[1] = bytepos+1;
            fillbits[0] = (1<<(bytepos+1))-1;
            writeBits(fillbits);
        }

        writeWord(0xFFD9); //EOI

        if (typeof module === 'undefined') return new Uint8Array(byteout);
        return Buffer.from(byteout);

        var jpegDataUri = 'data:image/jpeg;base64,' + btoa(byteout.join(''));

        byteout = [];

        // benchmarking
        var duration = new Date().getTime() - time_start;
        //console.log('Encoding time: '+ duration + 'ms');
        //

        return jpegDataUri
    }

    function setQuality(quality){
        if (quality <= 0) {
            quality = 1;
        }
        if (quality > 100) {
            quality = 100;
        }

        if(currentQuality == quality) return // don't recalc if unchanged

        var sf = 0;
        if (quality < 50) {
            sf = Math.floor(5000 / quality);
        } else {
            sf = Math.floor(200 - quality*2);
        }

        initQuantTables(sf);
        currentQuality = quality;
        //console.log('Quality set to: '+quality +'%');
    }

    function init(){
        var time_start = new Date().getTime();
        if(!quality) quality = 50;
        // Create tables
        initCharLookupTable()
        initHuffmanTbl();
        initCategoryNumber();
        initRGBYUVTable();

        setQuality(quality);
        var duration = new Date().getTime() - time_start;
        //console.log('Initialization '+ duration + 'ms');
    }

    init();

};

function encode(imgData, qu) {
    if (typeof qu === 'undefined') qu = 50;
    var encoder = new JPEGEncoder(qu);
    var data = encoder.encode(imgData, qu);
    return {
        data: data,
        width: imgData.width,
        height: imgData.height,
    };
}

// helper function to get the imageData of an existing image on the current page.
function getImageDataFromImage(idOrElement){
    var theImg = (typeof(idOrElement)=='string')? document.getElementById(idOrElement):idOrElement;
    var cvs = document.createElement('canvas');
    cvs.width = theImg.width;
    cvs.height = theImg.height;
    var ctx = cvs.getContext("2d");
    ctx.drawImage(theImg,0,0);

    return (ctx.getImageData(0, 0, cvs.width, cvs.height));
}
//------------------------------------------------------------------------------
/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
   Copyright 2011 notmasteryet

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// - The JPEG specification can be found in the ITU CCITT Recommendation T.81
//   (www.w3.org/Graphics/JPEG/itu-t81.pdf)
// - The JFIF specification can be found in the JPEG File Interchange Format
//   (www.w3.org/Graphics/JPEG/jfif3.pdf)
// - The Adobe Application-Specific JPEG markers in the Supporting the DCT Filters
//   in PostScript Level 2, Technical Note #5116
//   (partners.adobe.com/public/developer/en/ps/sdk/5116.DCT_Filter.pdf)

var JpegImage = (function jpegImage() {
    "use strict";
    var dctZigZag = new Int32Array([
        0,
        1,  8,
        16,  9,  2,
        3, 10, 17, 24,
        32, 25, 18, 11, 4,
        5, 12, 19, 26, 33, 40,
        48, 41, 34, 27, 20, 13,  6,
        7, 14, 21, 28, 35, 42, 49, 56,
        57, 50, 43, 36, 29, 22, 15,
        23, 30, 37, 44, 51, 58,
        59, 52, 45, 38, 31,
        39, 46, 53, 60,
        61, 54, 47,
        55, 62,
        63
    ]);

    var dctCos1  =  4017   // cos(pi/16)
    var dctSin1  =   799   // sin(pi/16)
    var dctCos3  =  3406   // cos(3*pi/16)
    var dctSin3  =  2276   // sin(3*pi/16)
    var dctCos6  =  1567   // cos(6*pi/16)
    var dctSin6  =  3784   // sin(6*pi/16)
    var dctSqrt2 =  5793   // sqrt(2)
    var dctSqrt1d2 = 2896  // sqrt(2) / 2

    function constructor() {
    }

    function buildHuffmanTable(codeLengths, values) {
        var k = 0, code = [], i, j, length = 16;
        while (length > 0 && !codeLengths[length - 1])
            length--;
        code.push({children: [], index: 0});
        var p = code[0], q;
        for (i = 0; i < length; i++) {
            for (j = 0; j < codeLengths[i]; j++) {
                p = code.pop();
                p.children[p.index] = values[k];
                while (p.index > 0) {
                    if (code.length === 0)
                        throw new Error('Could not recreate Huffman Table');
                    p = code.pop();
                }
                p.index++;
                code.push(p);
                while (code.length <= i) {
                    code.push(q = {children: [], index: 0});
                    p.children[p.index] = q.children;
                    p = q;
                }
                k++;
            }
            if (i + 1 < length) {
                // p here points to last code
                code.push(q = {children: [], index: 0});
                p.children[p.index] = q.children;
                p = q;
            }
        }
        return code[0].children;
    }

    function decodeScan(data, offset,
                        frame, components, resetInterval,
                        spectralStart, spectralEnd,
                        successivePrev, successive, opts) {
        var precision = frame.precision;
        var samplesPerLine = frame.samplesPerLine;
        var scanLines = frame.scanLines;
        var mcusPerLine = frame.mcusPerLine;
        var progressive = frame.progressive;
        var maxH = frame.maxH, maxV = frame.maxV;

        var startOffset = offset, bitsData = 0, bitsCount = 0;
        function readBit() {
            if (bitsCount > 0) {
                bitsCount--;
                return (bitsData >> bitsCount) & 1;
            }
            bitsData = data[offset++];
            if (bitsData == 0xFF) {
                var nextByte = data[offset++];
                if (nextByte) {
                    throw new Error("unexpected marker: " + ((bitsData << 8) | nextByte).toString(16));
                }
                // unstuff 0
            }
            bitsCount = 7;
            return bitsData >>> 7;
        }
        function decodeHuffman(tree) {
            var node = tree, bit;
            while ((bit = readBit()) !== null) {
                node = node[bit];
                if (typeof node === 'number')
                    return node;
                if (typeof node !== 'object')
                    throw new Error("invalid huffman sequence");
            }
            return null;
        }
        function receive(length) {
            var n = 0;
            while (length > 0) {
                var bit = readBit();
                if (bit === null) return;
                n = (n << 1) | bit;
                length--;
            }
            return n;
        }
        function receiveAndExtend(length) {
            var n = receive(length);
            if (n >= 1 << (length - 1))
                return n;
            return n + (-1 << length) + 1;
        }
        function decodeBaseline(component, zz) {
            var t = decodeHuffman(component.huffmanTableDC);
            var diff = t === 0 ? 0 : receiveAndExtend(t);
            zz[0]= (component.pred += diff);
            var k = 1;
            while (k < 64) {
                var rs = decodeHuffman(component.huffmanTableAC);
                var s = rs & 15, r = rs >> 4;
                if (s === 0) {
                    if (r < 15)
                        break;
                    k += 16;
                    continue;
                }
                k += r;
                var z = dctZigZag[k];
                zz[z] = receiveAndExtend(s);
                k++;
            }
        }
        function decodeDCFirst(component, zz) {
            var t = decodeHuffman(component.huffmanTableDC);
            var diff = t === 0 ? 0 : (receiveAndExtend(t) << successive);
            zz[0] = (component.pred += diff);
        }
        function decodeDCSuccessive(component, zz) {
            zz[0] |= readBit() << successive;
        }
        var eobrun = 0;
        function decodeACFirst(component, zz) {
            if (eobrun > 0) {
                eobrun--;
                return;
            }
            var k = spectralStart, e = spectralEnd;
            while (k <= e) {
                var rs = decodeHuffman(component.huffmanTableAC);
                var s = rs & 15, r = rs >> 4;
                if (s === 0) {
                    if (r < 15) {
                        eobrun = receive(r) + (1 << r) - 1;
                        break;
                    }
                    k += 16;
                    continue;
                }
                k += r;
                var z = dctZigZag[k];
                zz[z] = receiveAndExtend(s) * (1 << successive);
                k++;
            }
        }
        var successiveACState = 0, successiveACNextValue;
        function decodeACSuccessive(component, zz) {
            var k = spectralStart, e = spectralEnd, r = 0;
            while (k <= e) {
                var z = dctZigZag[k];
                var direction = zz[z] < 0 ? -1 : 1;
                switch (successiveACState) {
                    case 0: // initial state
                        var rs = decodeHuffman(component.huffmanTableAC);
                        var s = rs & 15, r = rs >> 4;
                        if (s === 0) {
                            if (r < 15) {
                                eobrun = receive(r) + (1 << r);
                                successiveACState = 4;
                            } else {
                                r = 16;
                                successiveACState = 1;
                            }
                        } else {
                            if (s !== 1)
                                throw new Error("invalid ACn encoding");
                            successiveACNextValue = receiveAndExtend(s);
                            successiveACState = r ? 2 : 3;
                        }
                        continue;
                    case 1: // skipping r zero items
                    case 2:
                        if (zz[z])
                            zz[z] += (readBit() << successive) * direction;
                        else {
                            r--;
                            if (r === 0)
                                successiveACState = successiveACState == 2 ? 3 : 0;
                        }
                        break;
                    case 3: // set value for a zero item
                        if (zz[z])
                            zz[z] += (readBit() << successive) * direction;
                        else {
                            zz[z] = successiveACNextValue << successive;
                            successiveACState = 0;
                        }
                        break;
                    case 4: // eob
                        if (zz[z])
                            zz[z] += (readBit() << successive) * direction;
                        break;
                }
                k++;
            }
            if (successiveACState === 4) {
                eobrun--;
                if (eobrun === 0)
                    successiveACState = 0;
            }
        }
        function decodeMcu(component, decode, mcu, row, col) {
            var mcuRow = (mcu / mcusPerLine) | 0;
            var mcuCol = mcu % mcusPerLine;
            var blockRow = mcuRow * component.v + row;
            var blockCol = mcuCol * component.h + col;
            // If the block is missing and we're in tolerant mode, just skip it.
            if (component.blocks[blockRow] === undefined && opts.tolerantDecoding)
                return;
            decode(component, component.blocks[blockRow][blockCol]);
        }
        function decodeBlock(component, decode, mcu) {
            var blockRow = (mcu / component.blocksPerLine) | 0;
            var blockCol = mcu % component.blocksPerLine;
            // If the block is missing and we're in tolerant mode, just skip it.
            if (component.blocks[blockRow] === undefined && opts.tolerantDecoding)
                return;
            decode(component, component.blocks[blockRow][blockCol]);
        }

        var componentsLength = components.length;
        var component, i, j, k, n;
        var decodeFn;
        if (progressive) {
            if (spectralStart === 0)
                decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
            else
                decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
        } else {
            decodeFn = decodeBaseline;
        }

        var mcu = 0, marker;
        var mcuExpected;
        if (componentsLength == 1) {
            mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
        } else {
            mcuExpected = mcusPerLine * frame.mcusPerColumn;
        }
        if (!resetInterval) resetInterval = mcuExpected;

        var h, v;
        while (mcu < mcuExpected) {
            // reset interval stuff
            for (i = 0; i < componentsLength; i++)
                components[i].pred = 0;
            eobrun = 0;

            if (componentsLength == 1) {
                component = components[0];
                for (n = 0; n < resetInterval; n++) {
                    decodeBlock(component, decodeFn, mcu);
                    mcu++;
                }
            } else {
                for (n = 0; n < resetInterval; n++) {
                    for (i = 0; i < componentsLength; i++) {
                        component = components[i];
                        h = component.h;
                        v = component.v;
                        for (j = 0; j < v; j++) {
                            for (k = 0; k < h; k++) {
                                decodeMcu(component, decodeFn, mcu, j, k);
                            }
                        }
                    }
                    mcu++;

                    // If we've reached our expected MCU's, stop decoding
                    if (mcu === mcuExpected) break;
                }
            }

            if (mcu === mcuExpected) {
                // Skip trailing bytes at the end of the scan - until we reach the next marker
                do {
                    if (data[offset] === 0xFF) {
                        if (data[offset + 1] !== 0x00) {
                            break;
                        }
                    }
                    offset += 1;
                } while (offset < data.length - 2);
            }

            // find marker
            bitsCount = 0;
            marker = (data[offset] << 8) | data[offset + 1];
            if (marker < 0xFF00) {
                throw new Error("marker was not found");
            }

            if (marker >= 0xFFD0 && marker <= 0xFFD7) { // RSTx
                offset += 2;
            }
            else
                break;
        }

        return offset - startOffset;
    }

    function buildComponentData(frame, component) {
        var lines = [];
        var blocksPerLine = component.blocksPerLine;
        var blocksPerColumn = component.blocksPerColumn;
        var samplesPerLine = blocksPerLine << 3;
        // Only 1 used per invocation of this function and garbage collected after invocation, so no need to account for its memory footprint.
        var R = new Int32Array(64), r = new Uint8Array(64);

        // A port of poppler's IDCT method which in turn is taken from:
        //   Christoph Loeffler, Adriaan Ligtenberg, George S. Moschytz,
        //   "Practical Fast 1-D DCT Algorithms with 11 Multiplications",
        //   IEEE Intl. Conf. on Acoustics, Speech & Signal Processing, 1989,
        //   988-991.
        function quantizeAndInverse(zz, dataOut, dataIn) {
            var qt = component.quantizationTable;
            var v0, v1, v2, v3, v4, v5, v6, v7, t;
            var p = dataIn;
            var i;

            // dequant
            for (i = 0; i < 64; i++)
                p[i] = zz[i] * qt[i];

            // inverse DCT on rows
            for (i = 0; i < 8; ++i) {
                var row = 8 * i;

                // check for all-zero AC coefficients
                if (p[1 + row] == 0 && p[2 + row] == 0 && p[3 + row] == 0 &&
                    p[4 + row] == 0 && p[5 + row] == 0 && p[6 + row] == 0 &&
                    p[7 + row] == 0) {
                    t = (dctSqrt2 * p[0 + row] + 512) >> 10;
                    p[0 + row] = t;
                    p[1 + row] = t;
                    p[2 + row] = t;
                    p[3 + row] = t;
                    p[4 + row] = t;
                    p[5 + row] = t;
                    p[6 + row] = t;
                    p[7 + row] = t;
                    continue;
                }

                // stage 4
                v0 = (dctSqrt2 * p[0 + row] + 128) >> 8;
                v1 = (dctSqrt2 * p[4 + row] + 128) >> 8;
                v2 = p[2 + row];
                v3 = p[6 + row];
                v4 = (dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128) >> 8;
                v7 = (dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128) >> 8;
                v5 = p[3 + row] << 4;
                v6 = p[5 + row] << 4;

                // stage 3
                t = (v0 - v1+ 1) >> 1;
                v0 = (v0 + v1 + 1) >> 1;
                v1 = t;
                t = (v2 * dctSin6 + v3 * dctCos6 + 128) >> 8;
                v2 = (v2 * dctCos6 - v3 * dctSin6 + 128) >> 8;
                v3 = t;
                t = (v4 - v6 + 1) >> 1;
                v4 = (v4 + v6 + 1) >> 1;
                v6 = t;
                t = (v7 + v5 + 1) >> 1;
                v5 = (v7 - v5 + 1) >> 1;
                v7 = t;

                // stage 2
                t = (v0 - v3 + 1) >> 1;
                v0 = (v0 + v3 + 1) >> 1;
                v3 = t;
                t = (v1 - v2 + 1) >> 1;
                v1 = (v1 + v2 + 1) >> 1;
                v2 = t;
                t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
                v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
                v7 = t;
                t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
                v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
                v6 = t;

                // stage 1
                p[0 + row] = v0 + v7;
                p[7 + row] = v0 - v7;
                p[1 + row] = v1 + v6;
                p[6 + row] = v1 - v6;
                p[2 + row] = v2 + v5;
                p[5 + row] = v2 - v5;
                p[3 + row] = v3 + v4;
                p[4 + row] = v3 - v4;
            }

            // inverse DCT on columns
            for (i = 0; i < 8; ++i) {
                var col = i;

                // check for all-zero AC coefficients
                if (p[1*8 + col] == 0 && p[2*8 + col] == 0 && p[3*8 + col] == 0 &&
                    p[4*8 + col] == 0 && p[5*8 + col] == 0 && p[6*8 + col] == 0 &&
                    p[7*8 + col] == 0) {
                    t = (dctSqrt2 * dataIn[i+0] + 8192) >> 14;
                    p[0*8 + col] = t;
                    p[1*8 + col] = t;
                    p[2*8 + col] = t;
                    p[3*8 + col] = t;
                    p[4*8 + col] = t;
                    p[5*8 + col] = t;
                    p[6*8 + col] = t;
                    p[7*8 + col] = t;
                    continue;
                }

                // stage 4
                v0 = (dctSqrt2 * p[0*8 + col] + 2048) >> 12;
                v1 = (dctSqrt2 * p[4*8 + col] + 2048) >> 12;
                v2 = p[2*8 + col];
                v3 = p[6*8 + col];
                v4 = (dctSqrt1d2 * (p[1*8 + col] - p[7*8 + col]) + 2048) >> 12;
                v7 = (dctSqrt1d2 * (p[1*8 + col] + p[7*8 + col]) + 2048) >> 12;
                v5 = p[3*8 + col];
                v6 = p[5*8 + col];

                // stage 3
                t = (v0 - v1 + 1) >> 1;
                v0 = (v0 + v1 + 1) >> 1;
                v1 = t;
                t = (v2 * dctSin6 + v3 * dctCos6 + 2048) >> 12;
                v2 = (v2 * dctCos6 - v3 * dctSin6 + 2048) >> 12;
                v3 = t;
                t = (v4 - v6 + 1) >> 1;
                v4 = (v4 + v6 + 1) >> 1;
                v6 = t;
                t = (v7 + v5 + 1) >> 1;
                v5 = (v7 - v5 + 1) >> 1;
                v7 = t;

                // stage 2
                t = (v0 - v3 + 1) >> 1;
                v0 = (v0 + v3 + 1) >> 1;
                v3 = t;
                t = (v1 - v2 + 1) >> 1;
                v1 = (v1 + v2 + 1) >> 1;
                v2 = t;
                t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
                v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
                v7 = t;
                t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
                v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
                v6 = t;

                // stage 1
                p[0*8 + col] = v0 + v7;
                p[7*8 + col] = v0 - v7;
                p[1*8 + col] = v1 + v6;
                p[6*8 + col] = v1 - v6;
                p[2*8 + col] = v2 + v5;
                p[5*8 + col] = v2 - v5;
                p[3*8 + col] = v3 + v4;
                p[4*8 + col] = v3 - v4;
            }

            // convert to 8-bit integers
            for (i = 0; i < 64; ++i) {
                var sample = 128 + ((p[i] + 8) >> 4);
                dataOut[i] = sample < 0 ? 0 : sample > 0xFF ? 0xFF : sample;
            }
        }

        requestMemoryAllocation(samplesPerLine * blocksPerColumn * 8);

        var i, j;
        for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
            var scanLine = blockRow << 3;
            for (i = 0; i < 8; i++)
                lines.push(new Uint8Array(samplesPerLine));
            for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
                quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);

                var offset = 0, sample = blockCol << 3;
                for (j = 0; j < 8; j++) {
                    var line = lines[scanLine + j];
                    for (i = 0; i < 8; i++)
                        line[sample + i] = r[offset++];
                }
            }
        }
        return lines;
    }

    function clampTo8bit(a) {
        return a < 0 ? 0 : a > 255 ? 255 : a;
    }

    constructor.prototype = {
        load: function load(path) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = (function() {
                // TODO catch parse error
                var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
                this.parse(data);
                if (this.onload)
                    this.onload();
            }).bind(this);
            xhr.send(null);
        },
        parse: function parse(data) {
            var maxResolutionInPixels = this.opts.maxResolutionInMP * 1000 * 1000;
            var offset = 0, length = data.length;
            function readUint16() {
                var value = (data[offset] << 8) | data[offset + 1];
                offset += 2;
                return value;
            }
            function readDataBlock() {
                var length = readUint16();
                var array = data.subarray(offset, offset + length - 2);
                offset += array.length;
                return array;
            }
            function prepareComponents(frame) {
                // According to the JPEG standard, the sampling factor must be between 1 and 4
                // See https://github.com/libjpeg-turbo/libjpeg-turbo/blob/9abeff46d87bd201a952e276f3e4339556a403a3/libjpeg.txt#L1138-L1146
                var maxH = 1, maxV = 1;
                var component, componentId;
                for (componentId in frame.components) {
                    if (frame.components.hasOwnProperty(componentId)) {
                        component = frame.components[componentId];
                        if (maxH < component.h) maxH = component.h;
                        if (maxV < component.v) maxV = component.v;
                    }
                }
                var mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / maxH);
                var mcusPerColumn = Math.ceil(frame.scanLines / 8 / maxV);
                for (componentId in frame.components) {
                    if (frame.components.hasOwnProperty(componentId)) {
                        component = frame.components[componentId];
                        var blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / maxH);
                        var blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines  / 8) * component.v / maxV);
                        var blocksPerLineForMcu = mcusPerLine * component.h;
                        var blocksPerColumnForMcu = mcusPerColumn * component.v;
                        var blocksToAllocate = blocksPerColumnForMcu * blocksPerLineForMcu;
                        var blocks = [];

                        // Each block is a Int32Array of length 64 (4 x 64 = 256 bytes)
                        requestMemoryAllocation(blocksToAllocate * 256);

                        for (var i = 0; i < blocksPerColumnForMcu; i++) {
                            var row = [];
                            for (var j = 0; j < blocksPerLineForMcu; j++)
                                row.push(new Int32Array(64));
                            blocks.push(row);
                        }
                        component.blocksPerLine = blocksPerLine;
                        component.blocksPerColumn = blocksPerColumn;
                        component.blocks = blocks;
                    }
                }
                frame.maxH = maxH;
                frame.maxV = maxV;
                frame.mcusPerLine = mcusPerLine;
                frame.mcusPerColumn = mcusPerColumn;
            }
            var jfif = null;
            var adobe = null;
            var pixels = null;
            var frame, resetInterval;
            var quantizationTables = [], frames = [];
            var huffmanTablesAC = [], huffmanTablesDC = [];
            var fileMarker = readUint16();
            var malformedDataOffset = -1;
            this.comments = [];
            if (fileMarker != 0xFFD8) { // SOI (Start of Image)
                throw new Error("SOI not found");
            }

            fileMarker = readUint16();
            while (fileMarker != 0xFFD9) { // EOI (End of image)
                var i, j, l;
                switch(fileMarker) {
                    case 0xFF00: break;
                    case 0xFFE0: // APP0 (Application Specific)
                    case 0xFFE1: // APP1
                    case 0xFFE2: // APP2
                    case 0xFFE3: // APP3
                    case 0xFFE4: // APP4
                    case 0xFFE5: // APP5
                    case 0xFFE6: // APP6
                    case 0xFFE7: // APP7
                    case 0xFFE8: // APP8
                    case 0xFFE9: // APP9
                    case 0xFFEA: // APP10
                    case 0xFFEB: // APP11
                    case 0xFFEC: // APP12
                    case 0xFFED: // APP13
                    case 0xFFEE: // APP14
                    case 0xFFEF: // APP15
                    case 0xFFFE: // COM (Comment)
                        var appData = readDataBlock();

                        if (fileMarker === 0xFFFE) {
                            var comment = String.fromCharCode.apply(null, appData);
                            this.comments.push(comment);
                        }

                        if (fileMarker === 0xFFE0) {
                            if (appData[0] === 0x4A && appData[1] === 0x46 && appData[2] === 0x49 &&
                                appData[3] === 0x46 && appData[4] === 0) { // 'JFIF\x00'
                                jfif = {
                                    version: { major: appData[5], minor: appData[6] },
                                    densityUnits: appData[7],
                                    xDensity: (appData[8] << 8) | appData[9],
                                    yDensity: (appData[10] << 8) | appData[11],
                                    thumbWidth: appData[12],
                                    thumbHeight: appData[13],
                                    thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                                };
                            }
                        }
                        // TODO APP1 - Exif
                        if (fileMarker === 0xFFE1) {
                            if (appData[0] === 0x45 &&
                                appData[1] === 0x78 &&
                                appData[2] === 0x69 &&
                                appData[3] === 0x66 &&
                                appData[4] === 0) { // 'EXIF\x00'
                                this.exifBuffer = appData.subarray(5, appData.length);
                            }
                        }

                        if (fileMarker === 0xFFEE) {
                            if (appData[0] === 0x41 && appData[1] === 0x64 && appData[2] === 0x6F &&
                                appData[3] === 0x62 && appData[4] === 0x65 && appData[5] === 0) { // 'Adobe\x00'
                                adobe = {
                                    version: appData[6],
                                    flags0: (appData[7] << 8) | appData[8],
                                    flags1: (appData[9] << 8) | appData[10],
                                    transformCode: appData[11]
                                };
                            }
                        }
                        break;

                    case 0xFFDB: // DQT (Define Quantization Tables)
                        var quantizationTablesLength = readUint16();
                        var quantizationTablesEnd = quantizationTablesLength + offset - 2;
                        while (offset < quantizationTablesEnd) {
                            var quantizationTableSpec = data[offset++];
                            requestMemoryAllocation(64 * 4);
                            var tableData = new Int32Array(64);
                            if ((quantizationTableSpec >> 4) === 0) { // 8 bit values
                                for (j = 0; j < 64; j++) {
                                    var z = dctZigZag[j];
                                    tableData[z] = data[offset++];
                                }
                            } else if ((quantizationTableSpec >> 4) === 1) { //16 bit
                                for (j = 0; j < 64; j++) {
                                    var z = dctZigZag[j];
                                    tableData[z] = readUint16();
                                }
                            } else
                                throw new Error("DQT: invalid table spec");
                            quantizationTables[quantizationTableSpec & 15] = tableData;
                        }
                        break;

                    case 0xFFC0: // SOF0 (Start of Frame, Baseline DCT)
                    case 0xFFC1: // SOF1 (Start of Frame, Extended DCT)
                    case 0xFFC2: // SOF2 (Start of Frame, Progressive DCT)
                        readUint16(); // skip data length
                        frame = {};
                        frame.extended = (fileMarker === 0xFFC1);
                        frame.progressive = (fileMarker === 0xFFC2);
                        frame.precision = data[offset++];
                        frame.scanLines = readUint16();
                        frame.samplesPerLine = readUint16();
                        frame.components = {};
                        frame.componentsOrder = [];

                        var pixelsInFrame = frame.scanLines * frame.samplesPerLine;
                        if (pixelsInFrame > maxResolutionInPixels) {
                            var exceededAmount = Math.ceil((pixelsInFrame - maxResolutionInPixels) / 1e6);
                            throw new Error(`maxResolutionInMP limit exceeded by ${exceededAmount}MP`);
                        }

                        var componentsCount = data[offset++], componentId;
                        var maxH = 0, maxV = 0;
                        for (i = 0; i < componentsCount; i++) {
                            componentId = data[offset];
                            var h = data[offset + 1] >> 4;
                            var v = data[offset + 1] & 15;
                            var qId = data[offset + 2];

                            if ( h <= 0 || v <= 0 ) {
                                throw new Error('Invalid sampling factor, expected values above 0');
                            }

                            frame.componentsOrder.push(componentId);
                            frame.components[componentId] = {
                                h: h,
                                v: v,
                                quantizationIdx: qId
                            };
                            offset += 3;
                        }
                        prepareComponents(frame);
                        frames.push(frame);
                        break;

                    case 0xFFC4: // DHT (Define Huffman Tables)
                        var huffmanLength = readUint16();
                        for (i = 2; i < huffmanLength;) {
                            var huffmanTableSpec = data[offset++];
                            var codeLengths = new Uint8Array(16);
                            var codeLengthSum = 0;
                            for (j = 0; j < 16; j++, offset++) {
                                codeLengthSum += (codeLengths[j] = data[offset]);
                            }
                            requestMemoryAllocation(16 + codeLengthSum);
                            var huffmanValues = new Uint8Array(codeLengthSum);
                            for (j = 0; j < codeLengthSum; j++, offset++)
                                huffmanValues[j] = data[offset];
                            i += 17 + codeLengthSum;

                            ((huffmanTableSpec >> 4) === 0 ?
                                huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] =
                                buildHuffmanTable(codeLengths, huffmanValues);
                        }
                        break;

                    case 0xFFDD: // DRI (Define Restart Interval)
                        readUint16(); // skip data length
                        resetInterval = readUint16();
                        break;

                    case 0xFFDC: // Number of Lines marker
                        readUint16() // skip data length
                        readUint16() // Ignore this data since it represents the image height
                        break;

                    case 0xFFDA: // SOS (Start of Scan)
                        var scanLength = readUint16();
                        var selectorsCount = data[offset++];
                        var components = [], component;
                        for (i = 0; i < selectorsCount; i++) {
                            component = frame.components[data[offset++]];
                            var tableSpec = data[offset++];
                            component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
                            component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
                            components.push(component);
                        }
                        var spectralStart = data[offset++];
                        var spectralEnd = data[offset++];
                        var successiveApproximation = data[offset++];
                        var processed = decodeScan(data, offset,
                            frame, components, resetInterval,
                            spectralStart, spectralEnd,
                            successiveApproximation >> 4, successiveApproximation & 15, this.opts);
                        offset += processed;
                        break;

                    case 0xFFFF: // Fill bytes
                        if (data[offset] !== 0xFF) { // Avoid skipping a valid marker.
                            offset--;
                        }
                        break;
                    default:
                        if (data[offset - 3] == 0xFF &&
                            data[offset - 2] >= 0xC0 && data[offset - 2] <= 0xFE) {
                            // could be incorrect encoding -- last 0xFF byte of the previous
                            // block was eaten by the encoder
                            offset -= 3;
                            break;
                        }
                        else if (fileMarker === 0xE0 || fileMarker == 0xE1) {
                            // Recover from malformed APP1 markers popular in some phone models.
                            // See https://github.com/eugeneware/jpeg-js/issues/82
                            if (malformedDataOffset !== -1) {
                                throw new Error(`first unknown JPEG marker at offset ${malformedDataOffset.toString(16)}, second unknown JPEG marker ${fileMarker.toString(16)} at offset ${(offset - 1).toString(16)}`);
                            }
                            malformedDataOffset = offset - 1;
                            const nextOffset = readUint16();
                            if (data[offset + nextOffset - 2] === 0xFF) {
                                offset += nextOffset - 2;
                                break;
                            }
                        }
                        throw new Error("unknown JPEG marker " + fileMarker.toString(16));
                }
                fileMarker = readUint16();
            }
            if (frames.length != 1)
                throw new Error("only single frame JPEGs supported");

            // set each frame's components quantization table
            for (var i = 0; i < frames.length; i++) {
                var cp = frames[i].components;
                for (var j in cp) {
                    cp[j].quantizationTable = quantizationTables[cp[j].quantizationIdx];
                    delete cp[j].quantizationIdx;
                }
            }

            this.width = frame.samplesPerLine;
            this.height = frame.scanLines;
            this.jfif = jfif;
            this.adobe = adobe;
            this.components = [];
            for (var i = 0; i < frame.componentsOrder.length; i++) {
                var component = frame.components[frame.componentsOrder[i]];
                this.components.push({
                    lines: buildComponentData(frame, component),
                    scaleX: component.h / frame.maxH,
                    scaleY: component.v / frame.maxV
                });
            }
        },
        getData: function getData(width, height) {
            var scaleX = this.width / width, scaleY = this.height / height;

            var component1, component2, component3, component4;
            var component1Line, component2Line, component3Line, component4Line;
            var x, y;
            var offset = 0;
            var Y, Cb, Cr, K, C, M, Ye, R, G, B;
            var colorTransform;
            var dataLength = width * height * this.components.length;
            requestMemoryAllocation(dataLength);
            var data = new Uint8Array(dataLength);
            switch (this.components.length) {
                case 1:
                    component1 = this.components[0];
                    for (y = 0; y < height; y++) {
                        component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
                        for (x = 0; x < width; x++) {
                            Y = component1Line[0 | (x * component1.scaleX * scaleX)];

                            data[offset++] = Y;
                        }
                    }
                    break;
                case 2:
                    // PDF might compress two component data in custom colorspace
                    component1 = this.components[0];
                    component2 = this.components[1];
                    for (y = 0; y < height; y++) {
                        component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
                        component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
                        for (x = 0; x < width; x++) {
                            Y = component1Line[0 | (x * component1.scaleX * scaleX)];
                            data[offset++] = Y;
                            Y = component2Line[0 | (x * component2.scaleX * scaleX)];
                            data[offset++] = Y;
                        }
                    }
                    break;
                case 3:
                    // The default transform for three components is true
                    colorTransform = true;
                    // The adobe transform marker overrides any previous setting
                    if (this.adobe && this.adobe.transformCode)
                        colorTransform = true;
                    else if (typeof this.opts.colorTransform !== 'undefined')
                        colorTransform = !!this.opts.colorTransform;

                    component1 = this.components[0];
                    component2 = this.components[1];
                    component3 = this.components[2];
                    for (y = 0; y < height; y++) {
                        component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
                        component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
                        component3Line = component3.lines[0 | (y * component3.scaleY * scaleY)];
                        for (x = 0; x < width; x++) {
                            if (!colorTransform) {
                                R = component1Line[0 | (x * component1.scaleX * scaleX)];
                                G = component2Line[0 | (x * component2.scaleX * scaleX)];
                                B = component3Line[0 | (x * component3.scaleX * scaleX)];
                            } else {
                                Y = component1Line[0 | (x * component1.scaleX * scaleX)];
                                Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
                                Cr = component3Line[0 | (x * component3.scaleX * scaleX)];

                                R = clampTo8bit(Y + 1.402 * (Cr - 128));
                                G = clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                                B = clampTo8bit(Y + 1.772 * (Cb - 128));
                            }

                            data[offset++] = R;
                            data[offset++] = G;
                            data[offset++] = B;
                        }
                    }
                    break;
                case 4:
                    if (!this.adobe)
                        throw new Error('Unsupported color mode (4 components)');
                    // The default transform for four components is false
                    colorTransform = false;
                    // The adobe transform marker overrides any previous setting
                    if (this.adobe && this.adobe.transformCode)
                        colorTransform = true;
                    else if (typeof this.opts.colorTransform !== 'undefined')
                        colorTransform = !!this.opts.colorTransform;

                    component1 = this.components[0];
                    component2 = this.components[1];
                    component3 = this.components[2];
                    component4 = this.components[3];
                    for (y = 0; y < height; y++) {
                        component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
                        component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
                        component3Line = component3.lines[0 | (y * component3.scaleY * scaleY)];
                        component4Line = component4.lines[0 | (y * component4.scaleY * scaleY)];
                        for (x = 0; x < width; x++) {
                            if (!colorTransform) {
                                C = component1Line[0 | (x * component1.scaleX * scaleX)];
                                M = component2Line[0 | (x * component2.scaleX * scaleX)];
                                Ye = component3Line[0 | (x * component3.scaleX * scaleX)];
                                K = component4Line[0 | (x * component4.scaleX * scaleX)];
                            } else {
                                Y = component1Line[0 | (x * component1.scaleX * scaleX)];
                                Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
                                Cr = component3Line[0 | (x * component3.scaleX * scaleX)];
                                K = component4Line[0 | (x * component4.scaleX * scaleX)];

                                C = 255 - clampTo8bit(Y + 1.402 * (Cr - 128));
                                M = 255 - clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                                Ye = 255 - clampTo8bit(Y + 1.772 * (Cb - 128));
                            }
                            data[offset++] = 255-C;
                            data[offset++] = 255-M;
                            data[offset++] = 255-Ye;
                            data[offset++] = 255-K;
                        }
                    }
                    break;
                default:
                    throw new Error('Unsupported color mode');
            }
            return data;
        },
        copyToImageData: function copyToImageData(imageData, formatAsRGBA) {
            var width = imageData.width, height = imageData.height;
            var imageDataArray = imageData.data;
            var data = this.getData(width, height);
            var i = 0, j = 0, x, y;
            var Y, K, C, M, R, G, B;
            switch (this.components.length) {
                case 1:
                    for (y = 0; y < height; y++) {
                        for (x = 0; x < width; x++) {
                            Y = data[i++];

                            imageDataArray[j++] = Y;
                            imageDataArray[j++] = Y;
                            imageDataArray[j++] = Y;
                            if (formatAsRGBA) {
                                imageDataArray[j++] = 255;
                            }
                        }
                    }
                    break;
                case 3:
                    for (y = 0; y < height; y++) {
                        for (x = 0; x < width; x++) {
                            R = data[i++];
                            G = data[i++];
                            B = data[i++];

                            imageDataArray[j++] = R;
                            imageDataArray[j++] = G;
                            imageDataArray[j++] = B;
                            if (formatAsRGBA) {
                                imageDataArray[j++] = 255;
                            }
                        }
                    }
                    break;
                case 4:
                    for (y = 0; y < height; y++) {
                        for (x = 0; x < width; x++) {
                            C = data[i++];
                            M = data[i++];
                            Y = data[i++];
                            K = data[i++];

                            R = 255 - clampTo8bit(C * (1 - K / 255) + K);
                            G = 255 - clampTo8bit(M * (1 - K / 255) + K);
                            B = 255 - clampTo8bit(Y * (1 - K / 255) + K);

                            imageDataArray[j++] = R;
                            imageDataArray[j++] = G;
                            imageDataArray[j++] = B;
                            if (formatAsRGBA) {
                                imageDataArray[j++] = 255;
                            }
                        }
                    }
                    break;
                default:
                    throw new Error('Unsupported color mode');
            }
        }
    };


    // We cap the amount of memory used by jpeg-js to avoid unexpected OOMs from untrusted content.
    var totalBytesAllocated = 0;
    var maxMemoryUsageBytes = 0;
    function requestMemoryAllocation(increaseAmount = 0) {
        var totalMemoryImpactBytes = totalBytesAllocated + increaseAmount;
        if (totalMemoryImpactBytes > maxMemoryUsageBytes) {
            var exceededAmount = Math.ceil((totalMemoryImpactBytes - maxMemoryUsageBytes) / 1024 / 1024);
            throw new Error(`maxMemoryUsageInMB limit exceeded by at least ${exceededAmount}MB`);
        }

        totalBytesAllocated = totalMemoryImpactBytes;
    }

    constructor.resetMaxMemoryUsage = function (maxMemoryUsageBytes_) {
        totalBytesAllocated = 0;
        maxMemoryUsageBytes = maxMemoryUsageBytes_;
    };

    constructor.getBytesAllocated = function () {
        return totalBytesAllocated;
    };

    constructor.requestMemoryAllocation = requestMemoryAllocation;

    return constructor;
})();

function decode(jpegData, userOpts = {}) {
    var defaultOpts = {
        // "undefined" means "Choose whether to transform colors based on the image’s color model."
        colorTransform: undefined,
        useTArray: false,
        formatAsRGBA: true,
        tolerantDecoding: true,
        maxResolutionInMP: 100, // Don't decode more than 100 megapixels
        maxMemoryUsageInMB: 512, // Don't decode if memory footprint is more than 512MB
    };

    var opts = {...defaultOpts, ...userOpts};
    var arr = new Uint8Array(jpegData);
    var decoder = new JpegImage();
    decoder.opts = opts;
    // If this constructor ever supports async decoding this will need to be done differently.
    // Until then, treating as singleton limit is fine.
    JpegImage.resetMaxMemoryUsage(opts.maxMemoryUsageInMB * 1024 * 1024);
    decoder.parse(arr);

    var channels = (opts.formatAsRGBA) ? 4 : 3;
    var bytesNeeded = decoder.width * decoder.height * channels;
    try {
        JpegImage.requestMemoryAllocation(bytesNeeded);
        var image = {
            width: decoder.width,
            height: decoder.height,
            exifBuffer: decoder.exifBuffer,
            data: opts.useTArray ?
                new Uint8Array(bytesNeeded) :
                Buffer.alloc(bytesNeeded)
        };
        if(decoder.comments.length > 0) {
            image["comments"] = decoder.comments;
        }
    } catch (err) {
        if (err instanceof RangeError) {
            throw new Error("Could not allocate enough memory for the image. " +
                "Required: " + bytesNeeded);
        }

        if (err instanceof ReferenceError) {
            if (err.message === "Buffer is not defined") {
                throw new Error("Buffer is not globally defined in this environment. " +
                    "Consider setting useTArray to true");
            }
        }
        throw err;
    }

    decoder.copyToImageData(image, opts.formatAsRGBA);

    return image;
}
//-----------------------------------------------------------------

let PNG;

;(function(){
    var UPNG = {};

// Make available for import by `require()`
    var pako;
    pako = window.pako;
   PNG = UPNG;
    function log() { if (typeof process=="undefined" || process.env.NODE_ENV=="development") console.log.apply(console, arguments);  }
    (function(UPNG, pako){
        UPNG.toRGBA8 = function(out)
        {
            var w = out.width, h = out.height;
            if(out.tabs.acTL==null) return [UPNG.toRGBA8.decodeImage(out.data, w, h, out).buffer];

            var frms = [];
            if(out.frames[0].data==null) out.frames[0].data = out.data;

            var img, empty = new Uint8Array(w*h*4);
            for(var i=0; i<out.frames.length; i++)
            {
                var frm = out.frames[i];
                var fx=frm.rect.x, fy=frm.rect.y, fw = frm.rect.width, fh = frm.rect.height;
                var fdata = UPNG.toRGBA8.decodeImage(frm.data, fw,fh, out);

                if(i==0) img = fdata;
                else if(frm.blend  ==0) UPNG._copyTile(fdata, fw, fh, img, w, h, fx, fy, 0);
                else if(frm.blend  ==1) UPNG._copyTile(fdata, fw, fh, img, w, h, fx, fy, 1);

                frms.push(img.buffer);  img = img.slice(0);

                if     (frm.dispose==0) {}
                else if(frm.dispose==1) UPNG._copyTile(empty, fw, fh, img, w, h, fx, fy, 0);
                else if(frm.dispose==2) {
                    var pi = i-1;
                    while(out.frames[pi].dispose==2) pi--;
                    img = new Uint8Array(frms[pi]).slice(0);
                }
            }
            return frms;
        }
        UPNG.toRGBA8.decodeImage = function(data, w, h, out)
        {
            var area = w*h, bpp = UPNG.decode._getBPP(out);
            var bpl = Math.ceil(w*bpp/8);	// bytes per line

            var bf = new Uint8Array(area*4), bf32 = new Uint32Array(bf.buffer);
            var ctype = out.ctype, depth = out.depth;
            var rs = UPNG._bin.readUshort;

            //console.log(ctype, depth);

            if     (ctype==6) { // RGB + alpha
                var qarea = area<<2;
                if(depth== 8) for(var i=0; i<qarea;i++) {  bf[i] = data[i];  /*if((i&3)==3 && data[i]!=0) bf[i]=255;*/ }
                if(depth==16) for(var i=0; i<qarea;i++) {  bf[i] = data[i<<1];  }
            }
            else if(ctype==2) {	// RGB
                var ts=out.tabs["tRNS"], tr=-1, tg=-1, tb=-1;
                if(ts) {  tr=ts[0];  tg=ts[1];  tb=ts[2];  }
                if(depth== 8) for(var i=0; i<area; i++) {  var qi=i<<2, ti=i*3;  bf[qi] = data[ti];  bf[qi+1] = data[ti+1];  bf[qi+2] = data[ti+2];  bf[qi+3] = 255;
                    if(tr!=-1 && data[ti]   ==tr && data[ti+1]   ==tg && data[ti+2]   ==tb) bf[qi+3] = 0;  }
                if(depth==16) for(var i=0; i<area; i++) {  var qi=i<<2, ti=i*6;  bf[qi] = data[ti];  bf[qi+1] = data[ti+2];  bf[qi+2] = data[ti+4];  bf[qi+3] = 255;
                    if(tr!=-1 && rs(data,ti)==tr && rs(data,ti+2)==tg && rs(data,ti+4)==tb) bf[qi+3] = 0;  }
            }
            else if(ctype==3) {	// palette
                var p=out.tabs["PLTE"], ap=out.tabs["tRNS"], tl=ap?ap.length:0;
                //console.log(p, ap);
                if(depth==1) for(var y=0; y<h; y++) {  var s0 = y*bpl, t0 = y*w;
                    for(var i=0; i<w; i++) { var qi=(t0+i)<<2, j=((data[s0+(i>>3)]>>(7-((i&7)<<0)))& 1), cj=3*j;  bf[qi]=p[cj];  bf[qi+1]=p[cj+1];  bf[qi+2]=p[cj+2];  bf[qi+3]=(j<tl)?ap[j]:255;  }
                }
                if(depth==2) for(var y=0; y<h; y++) {  var s0 = y*bpl, t0 = y*w;
                    for(var i=0; i<w; i++) { var qi=(t0+i)<<2, j=((data[s0+(i>>2)]>>(6-((i&3)<<1)))& 3), cj=3*j;  bf[qi]=p[cj];  bf[qi+1]=p[cj+1];  bf[qi+2]=p[cj+2];  bf[qi+3]=(j<tl)?ap[j]:255;  }
                }
                if(depth==4) for(var y=0; y<h; y++) {  var s0 = y*bpl, t0 = y*w;
                    for(var i=0; i<w; i++) { var qi=(t0+i)<<2, j=((data[s0+(i>>1)]>>(4-((i&1)<<2)))&15), cj=3*j;  bf[qi]=p[cj];  bf[qi+1]=p[cj+1];  bf[qi+2]=p[cj+2];  bf[qi+3]=(j<tl)?ap[j]:255;  }
                }
                if(depth==8) for(var i=0; i<area; i++ ) {  var qi=i<<2, j=data[i]                      , cj=3*j;  bf[qi]=p[cj];  bf[qi+1]=p[cj+1];  bf[qi+2]=p[cj+2];  bf[qi+3]=(j<tl)?ap[j]:255;  }
            }
            else if(ctype==4) {	// gray + alpha
                if(depth== 8)  for(var i=0; i<area; i++) {  var qi=i<<2, di=i<<1, gr=data[di];  bf[qi]=gr;  bf[qi+1]=gr;  bf[qi+2]=gr;  bf[qi+3]=data[di+1];  }
                if(depth==16)  for(var i=0; i<area; i++) {  var qi=i<<2, di=i<<2, gr=data[di];  bf[qi]=gr;  bf[qi+1]=gr;  bf[qi+2]=gr;  bf[qi+3]=data[di+2];  }
            }
            else if(ctype==0) {	// gray
                var tr = out.tabs["tRNS"] ? out.tabs["tRNS"] : -1;
                if(depth== 1) for(var i=0; i<area; i++) {  var gr=255*((data[i>>3]>>(7 -((i&7)   )))& 1), al=(gr==tr*255)?0:255;  bf32[i]=(al<<24)|(gr<<16)|(gr<<8)|gr;  }
                if(depth== 2) for(var i=0; i<area; i++) {  var gr= 85*((data[i>>2]>>(6 -((i&3)<<1)))& 3), al=(gr==tr* 85)?0:255;  bf32[i]=(al<<24)|(gr<<16)|(gr<<8)|gr;  }
                if(depth== 4) for(var i=0; i<area; i++) {  var gr= 17*((data[i>>1]>>(4 -((i&1)<<2)))&15), al=(gr==tr* 17)?0:255;  bf32[i]=(al<<24)|(gr<<16)|(gr<<8)|gr;  }
                if(depth== 8) for(var i=0; i<area; i++) {  var gr=data[i  ] , al=(gr           ==tr)?0:255;  bf32[i]=(al<<24)|(gr<<16)|(gr<<8)|gr;  }
                if(depth==16) for(var i=0; i<area; i++) {  var gr=data[i<<1], al=(rs(data,i<<1)==tr)?0:255;  bf32[i]=(al<<24)|(gr<<16)|(gr<<8)|gr;  }
            }
            return bf;
        }



        UPNG.decode = function(buff)
        {
            var data = new Uint8Array(buff), offset = 8, bin = UPNG._bin, rUs = bin.readUshort, rUi = bin.readUint;
            var out = {tabs:{}, frames:[]};
            var dd = new Uint8Array(data.length), doff = 0;	 // put all IDAT data into it
            var fd, foff = 0;	// frames

            var mgck = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
            for(var i=0; i<8; i++) if(data[i]!=mgck[i]) throw "The input is not a PNG file!";

            while(offset<data.length)
            {
                var len  = bin.readUint(data, offset);  offset += 4;
                var type = bin.readASCII(data, offset, 4);  offset += 4;
                //log(type,len);

                if     (type=="IHDR")  {  UPNG.decode._IHDR(data, offset, out);  }
                else if(type=="IDAT") {
                    for(var i=0; i<len; i++) dd[doff+i] = data[offset+i];
                    doff += len;
                }
                else if(type=="acTL")  {
                    out.tabs[type] = {  num_frames:rUi(data, offset), num_plays:rUi(data, offset+4)  };
                    fd = new Uint8Array(data.length);
                }
                else if(type=="fcTL")  {
                    if(foff!=0) {  var fr = out.frames[out.frames.length-1];
                        fr.data = UPNG.decode._decompress(out, fd.slice(0,foff), fr.rect.width, fr.rect.height);  foff=0;
                    }
                    var rct = {x:rUi(data, offset+12),y:rUi(data, offset+16),width:rUi(data, offset+4),height:rUi(data, offset+8)};
                    var del = rUs(data, offset+22);  del = rUs(data, offset+20) / (del==0?100:del);
                    var frm = {rect:rct, delay:Math.round(del*1000), dispose:data[offset+24], blend:data[offset+25]};
                    //console.log(frm);
                    out.frames.push(frm);
                }
                else if(type=="fdAT") {
                    for(var i=0; i<len-4; i++) fd[foff+i] = data[offset+i+4];
                    foff += len-4;
                }
                else if(type=="pHYs") {
                    out.tabs[type] = [bin.readUint(data, offset), bin.readUint(data, offset+4), data[offset+8]];
                }
                else if(type=="cHRM") {
                    out.tabs[type] = [];
                    for(var i=0; i<8; i++) out.tabs[type].push(bin.readUint(data, offset+i*4));
                }
                else if(type=="tEXt") {
                    if(out.tabs[type]==null) out.tabs[type] = {};
                    var nz = bin.nextZero(data, offset);
                    var keyw = bin.readASCII(data, offset, nz-offset);
                    var text = bin.readASCII(data, nz+1, offset+len-nz-1);
                    out.tabs[type][keyw] = text;
                }
                else if(type=="iTXt") {
                    if(out.tabs[type]==null) out.tabs[type] = {};
                    var nz = 0, off = offset;
                    nz = bin.nextZero(data, off);
                    var keyw = bin.readASCII(data, off, nz-off);  off = nz + 1;
                    var cflag = data[off], cmeth = data[off+1];  off+=2;
                    nz = bin.nextZero(data, off);
                    var ltag = bin.readASCII(data, off, nz-off);  off = nz + 1;
                    nz = bin.nextZero(data, off);
                    var tkeyw = bin.readUTF8(data, off, nz-off);  off = nz + 1;
                    var text  = bin.readUTF8(data, off, len-(off-offset));
                    out.tabs[type][keyw] = text;
                }
                else if(type=="PLTE") {
                    out.tabs[type] = bin.readBytes(data, offset, len);
                }
                else if(type=="hIST") {
                    var pl = out.tabs["PLTE"].length/3;
                    out.tabs[type] = [];  for(var i=0; i<pl; i++) out.tabs[type].push(rUs(data, offset+i*2));
                }
                else if(type=="tRNS") {
                    if     (out.ctype==3) out.tabs[type] = bin.readBytes(data, offset, len);
                    else if(out.ctype==0) out.tabs[type] = rUs(data, offset);
                    else if(out.ctype==2) out.tabs[type] = [ rUs(data,offset),rUs(data,offset+2),rUs(data,offset+4) ];
                    //else console.log("tRNS for unsupported color type",out.ctype, len);
                }
                else if(type=="gAMA") out.tabs[type] = bin.readUint(data, offset)/100000;
                else if(type=="sRGB") out.tabs[type] = data[offset];
                else if(type=="bKGD")
                {
                    if     (out.ctype==0 || out.ctype==4) out.tabs[type] = [rUs(data, offset)];
                    else if(out.ctype==2 || out.ctype==6) out.tabs[type] = [rUs(data, offset), rUs(data, offset+2), rUs(data, offset+4)];
                    else if(out.ctype==3) out.tabs[type] = data[offset];
                }
                else if(type=="IEND") {
                    if(foff!=0) {  var fr = out.frames[out.frames.length-1];
                        fr.data = UPNG.decode._decompress(out, fd.slice(0,foff), fr.rect.width, fr.rect.height);  foff=0;
                    }
                    out.data = UPNG.decode._decompress(out, dd, out.width, out.height);  break;
                }
                //else {  log("unknown chunk type", type, len);  }
                offset += len;
                var crc = bin.readUint(data, offset);  offset += 4;
            }
            delete out.compress;  delete out.interlace;  delete out.filter;
            return out;
        }

        UPNG.decode._decompress = function(out, dd, w, h) {
            if(out.compress ==0) dd = UPNG.decode._inflate(dd);

            if     (out.interlace==0) dd = UPNG.decode._filterZero(dd, out, 0, w, h);
            else if(out.interlace==1) dd = UPNG.decode._readInterlace(dd, out);
            return dd;
        }

        UPNG.decode._inflate = function(data) {  return pako["inflate"](data);  }

        UPNG.decode._readInterlace = function(data, out)
        {
            var w = out.width, h = out.height;
            var bpp = UPNG.decode._getBPP(out), cbpp = bpp>>3, bpl = Math.ceil(w*bpp/8);
            var img = new Uint8Array( h * bpl );
            var di = 0;

            var starting_row  = [ 0, 0, 4, 0, 2, 0, 1 ];
            var starting_col  = [ 0, 4, 0, 2, 0, 1, 0 ];
            var row_increment = [ 8, 8, 8, 4, 4, 2, 2 ];
            var col_increment = [ 8, 8, 4, 4, 2, 2, 1 ];

            var pass=0;
            while(pass<7)
            {
                var ri = row_increment[pass], ci = col_increment[pass];
                var sw = 0, sh = 0;
                var cr = starting_row[pass];  while(cr<h) {  cr+=ri;  sh++;  }
                var cc = starting_col[pass];  while(cc<w) {  cc+=ci;  sw++;  }
                var bpll = Math.ceil(sw*bpp/8);
                UPNG.decode._filterZero(data, out, di, sw, sh);

                var y=0, row = starting_row[pass];
                while(row<h)
                {
                    var col = starting_col[pass];
                    var cdi = (di+y*bpll)<<3;

                    while(col<w)
                    {
                        if(bpp==1) {
                            var val = data[cdi>>3];  val = (val>>(7-(cdi&7)))&1;
                            img[row*bpl + (col>>3)] |= (val << (7-((col&3)<<0)));
                        }
                        if(bpp==2) {
                            var val = data[cdi>>3];  val = (val>>(6-(cdi&7)))&3;
                            img[row*bpl + (col>>2)] |= (val << (6-((col&3)<<1)));
                        }
                        if(bpp==4) {
                            var val = data[cdi>>3];  val = (val>>(4-(cdi&7)))&15;
                            img[row*bpl + (col>>1)] |= (val << (4-((col&1)<<2)));
                        }
                        if(bpp>=8) {
                            var ii = row*bpl+col*cbpp;
                            for(var j=0; j<cbpp; j++) img[ii+j] = data[(cdi>>3)+j];
                        }
                        cdi+=bpp;  col+=ci;
                    }
                    y++;  row += ri;
                }
                if(sw*sh!=0) di += sh * (1 + bpll);
                pass = pass + 1;
            }
            return img;
        }

        UPNG.decode._getBPP = function(out) {
            var noc = [1,null,3,1,2,null,4][out.ctype];
            return noc * out.depth;
        }

        UPNG.decode._filterZero = function(data, out, off, w, h)
        {
            var bpp = UPNG.decode._getBPP(out), bpl = Math.ceil(w*bpp/8), paeth = UPNG.decode._paeth;
            bpp = Math.ceil(bpp/8);

            for(var y=0; y<h; y++)  {
                var i = off+y*bpl, di = i+y+1;
                var type = data[di-1];

                if     (type==0) for(var x=  0; x<bpl; x++) data[i+x] = data[di+x];
                else if(type==1) {
                    for(var x=  0; x<bpp; x++) data[i+x] = data[di+x];
                    for(var x=bpp; x<bpl; x++) data[i+x] = (data[di+x] + data[i+x-bpp])&255;
                }
                else if(y==0) {
                    for(var x=  0; x<bpp; x++) data[i+x] = data[di+x];
                    if(type==2) for(var x=bpp; x<bpl; x++) data[i+x] = (data[di+x])&255;
                    if(type==3) for(var x=bpp; x<bpl; x++) data[i+x] = (data[di+x] + (data[i+x-bpp]>>1) )&255;
                    if(type==4) for(var x=bpp; x<bpl; x++) data[i+x] = (data[di+x] + paeth(data[i+x-bpp], 0, 0) )&255;
                }
                else {
                    if(type==2) { for(var x=  0; x<bpl; x++) data[i+x] = (data[di+x] + data[i+x-bpl])&255;  }

                    if(type==3) { for(var x=  0; x<bpp; x++) data[i+x] = (data[di+x] + (data[i+x-bpl]>>1))&255;
                        for(var x=bpp; x<bpl; x++) data[i+x] = (data[di+x] + ((data[i+x-bpl]+data[i+x-bpp])>>1) )&255;  }

                    if(type==4) { for(var x=  0; x<bpp; x++) data[i+x] = (data[di+x] + paeth(0, data[i+x-bpl], 0))&255;
                        for(var x=bpp; x<bpl; x++) data[i+x] = (data[di+x] + paeth(data[i+x-bpp], data[i+x-bpl], data[i+x-bpp-bpl]) )&255;  }
                }
            }
            return data;
        }

        UPNG.decode._paeth = function(a,b,c)
        {
            var p = a+b-c, pa = Math.abs(p-a), pb = Math.abs(p-b), pc = Math.abs(p-c);
            if (pa <= pb && pa <= pc)  return a;
            else if (pb <= pc)  return b;
            return c;
        }

        UPNG.decode._IHDR = function(data, offset, out)
        {
            var bin = UPNG._bin;
            out.width  = bin.readUint(data, offset);  offset += 4;
            out.height = bin.readUint(data, offset);  offset += 4;
            out.depth     = data[offset];  offset++;
            out.ctype     = data[offset];  offset++;
            out.compress  = data[offset];  offset++;
            out.filter    = data[offset];  offset++;
            out.interlace = data[offset];  offset++;
        }

        UPNG._bin = {
            nextZero   : function(data,p)  {  while(data[p]!=0) p++;  return p;  },
            readUshort : function(buff,p)  {  return (buff[p]<< 8) | buff[p+1];  },
            writeUshort: function(buff,p,n){  buff[p] = (n>>8)&255;  buff[p+1] = n&255;  },
            readUint   : function(buff,p)  {  return (buff[p]*(256*256*256)) + ((buff[p+1]<<16) | (buff[p+2]<< 8) | buff[p+3]);  },
            writeUint  : function(buff,p,n){  buff[p]=(n>>24)&255;  buff[p+1]=(n>>16)&255;  buff[p+2]=(n>>8)&255;  buff[p+3]=n&255;  },
            readASCII  : function(buff,p,l){  var s = "";  for(var i=0; i<l; i++) s += String.fromCharCode(buff[p+i]);  return s;    },
            writeASCII : function(data,p,s){  for(var i=0; i<s.length; i++) data[p+i] = s.charCodeAt(i);  },
            readBytes  : function(buff,p,l){  var arr = [];   for(var i=0; i<l; i++) arr.push(buff[p+i]);   return arr;  },
            pad : function(n) { return n.length < 2 ? "0" + n : n; },
            readUTF8 : function(buff, p, l) {
                var s = "", ns;
                for(var i=0; i<l; i++) s += "%" + UPNG._bin.pad(buff[p+i].toString(16));
                try {  ns = decodeURIComponent(s); }
                catch(e) {  return UPNG._bin.readASCII(buff, p, l);  }
                return  ns;
            }
        }
        UPNG._copyTile = function(sb, sw, sh, tb, tw, th, xoff, yoff, mode)
        {
            var w = Math.min(sw,tw), h = Math.min(sh,th);
            var si=0, ti=0;
            for(var y=0; y<h; y++)
                for(var x=0; x<w; x++)
                {
                    if(xoff>=0 && yoff>=0) {  si = (y*sw+x)<<2;  ti = (( yoff+y)*tw+xoff+x)<<2;  }
                    else                   {  si = ((-yoff+y)*sw-xoff+x)<<2;  ti = (y*tw+x)<<2;  }

                    if     (mode==0) {  tb[ti] = sb[si];  tb[ti+1] = sb[si+1];  tb[ti+2] = sb[si+2];  tb[ti+3] = sb[si+3];  }
                    else if(mode==1) {
                        var fa = sb[si+3]*(1/255), fr=sb[si]*fa, fg=sb[si+1]*fa, fb=sb[si+2]*fa;
                        var ba = tb[ti+3]*(1/255), br=tb[ti]*ba, bg=tb[ti+1]*ba, bb=tb[ti+2]*ba;

                        var ifa=1-fa, oa = fa+ba*ifa, ioa = (oa==0?0:1/oa);
                        tb[ti+3] = 255*oa;
                        tb[ti+0] = (fr+br*ifa)*ioa;
                        tb[ti+1] = (fg+bg*ifa)*ioa;
                        tb[ti+2] = (fb+bb*ifa)*ioa;
                    }
                    else if(mode==2){	// copy only differences, otherwise zero
                        var fa = sb[si+3], fr=sb[si], fg=sb[si+1], fb=sb[si+2];
                        var ba = tb[ti+3], br=tb[ti], bg=tb[ti+1], bb=tb[ti+2];
                        if(fa==ba && fr==br && fg==bg && fb==bb) {  tb[ti]=0;  tb[ti+1]=0;  tb[ti+2]=0;  tb[ti+3]=0;  }
                        else {  tb[ti]=fr;  tb[ti+1]=fg;  tb[ti+2]=fb;  tb[ti+3]=fa;  }
                    }
                    else if(mode==3){	// check if can be blended
                        var fa = sb[si+3], fr=sb[si], fg=sb[si+1], fb=sb[si+2];
                        var ba = tb[ti+3], br=tb[ti], bg=tb[ti+1], bb=tb[ti+2];
                        if(fa==ba && fr==br && fg==bg && fb==bb) continue;
                        //if(fa!=255 && ba!=0) return false;
                        if(fa<220 && ba>20) return false;
                    }
                }
            return true;
        }



        UPNG.encode = function(bufs, w, h, ps, dels, forbidPlte)
        {
            if(ps==null) ps=0;
            if(forbidPlte==null) forbidPlte = false;
            var data = new Uint8Array(bufs[0].byteLength*bufs.length+100);
            var wr=[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
            for(var i=0; i<8; i++) data[i]=wr[i];
            var offset = 8,  bin = UPNG._bin, crc = UPNG.crc.crc, wUi = bin.writeUint, wUs = bin.writeUshort, wAs = bin.writeASCII;

            var nimg = UPNG.encode.compressPNG(bufs, w, h, ps, forbidPlte);

            wUi(data,offset, 13);     offset+=4;
            wAs(data,offset,"IHDR");  offset+=4;
            wUi(data,offset,w);  offset+=4;
            wUi(data,offset,h);  offset+=4;
            data[offset] = nimg.depth;  offset++;  // depth
            data[offset] = nimg.ctype;  offset++;  // ctype
            data[offset] = 0;  offset++;  // compress
            data[offset] = 0;  offset++;  // filter
            data[offset] = 0;  offset++;  // interlace
            wUi(data,offset,crc(data,offset-17,17));  offset+=4; // crc

            // 9 bytes to say, that it is sRGB
            wUi(data,offset, 1);      offset+=4;
            wAs(data,offset,"sRGB");  offset+=4;
            data[offset] = 1;  offset++;
            wUi(data,offset,crc(data,offset-5,5));  offset+=4; // crc

            var anim = bufs.length>1;
            if(anim) {
                wUi(data,offset, 8);      offset+=4;
                wAs(data,offset,"acTL");  offset+=4;
                wUi(data,offset, bufs.length);      offset+=4;
                wUi(data,offset, 0);      offset+=4;
                wUi(data,offset,crc(data,offset-12,12));  offset+=4; // crc
            }

            if(nimg.ctype==3) {
                var dl = nimg.plte.length;
                wUi(data,offset, dl*3);  offset+=4;
                wAs(data,offset,"PLTE");  offset+=4;
                for(var i=0; i<dl; i++){
                    var ti=i*3, c=nimg.plte[i], r=(c)&255, g=(c>>8)&255, b=(c>>16)&255;
                    data[offset+ti+0]=r;  data[offset+ti+1]=g;  data[offset+ti+2]=b;
                }
                offset+=dl*3;
                wUi(data,offset,crc(data,offset-dl*3-4,dl*3+4));  offset+=4; // crc

                if(nimg.gotAlpha) {
                    wUi(data,offset, dl);  offset+=4;
                    wAs(data,offset,"tRNS");  offset+=4;
                    for(var i=0; i<dl; i++)  data[offset+i]=(nimg.plte[i]>>24)&255;
                    offset+=dl;
                    wUi(data,offset,crc(data,offset-dl-4,dl+4));  offset+=4; // crc
                }
            }

            var fi = 0;
            for(var j=0; j<nimg.frames.length; j++)
            {
                var fr = nimg.frames[j];
                if(anim) {
                    wUi(data,offset, 26);     offset+=4;
                    wAs(data,offset,"fcTL");  offset+=4;
                    wUi(data, offset, fi++);   offset+=4;
                    wUi(data, offset, fr.rect.width );   offset+=4;
                    wUi(data, offset, fr.rect.height);   offset+=4;
                    wUi(data, offset, fr.rect.x);   offset+=4;
                    wUi(data, offset, fr.rect.y);   offset+=4;
                    wUs(data, offset, dels[j]);   offset+=2;
                    wUs(data, offset,  1000);   offset+=2;
                    data[offset] = fr.dispose;  offset++;	// dispose
                    data[offset] = fr.blend  ;  offset++;	// blend
                    wUi(data,offset,crc(data,offset-30,30));  offset+=4; // crc
                }

                var imgd = fr.cimg, dl = imgd.length;
                wUi(data,offset, dl+(j==0?0:4));     offset+=4;
                var ioff = offset;
                wAs(data,offset,(j==0)?"IDAT":"fdAT");  offset+=4;
                if(j!=0) {  wUi(data, offset, fi++);  offset+=4;  }
                for(var i=0; i<dl; i++) data[offset+i] = imgd[i];
                offset += dl;
                wUi(data,offset,crc(data,ioff,offset-ioff));  offset+=4; // crc
            }

            wUi(data,offset, 0);     offset+=4;
            wAs(data,offset,"IEND");  offset+=4;
            wUi(data,offset,crc(data,offset-4,4));  offset+=4; // crc

            return data.buffer.slice(0,offset);
        }

        UPNG.encode.compressPNG = function(bufs, w, h, ps, forbidPlte)
        {
            var out = UPNG.encode.compress(bufs, w, h, ps, false, forbidPlte);
            for(var i=0; i<bufs.length; i++) {
                var frm = out.frames[i], nw=frm.rect.width, nh=frm.rect.height, bpl=frm.bpl, bpp=frm.bpp;
                var fdata = new Uint8Array(nh*bpl+nh);
                frm.cimg = UPNG.encode._filterZero(frm.img,nh,bpp,bpl,fdata);
            }
            return out;
        }

        UPNG.encode.compress = function(bufs, w, h, ps, forGIF, forbidPlte)
        {
            if(forbidPlte==null) forbidPlte = false;

            var ctype = 6, depth = 8, bpp = 4, alphaAnd=255

            for(var j=0; j<bufs.length; j++)  {  // when not quantized, other frames can contain colors, that are not in an initial frame
                var img = new Uint8Array(bufs[j]), ilen = img.length;
                for(var i=0; i<ilen; i+=4) alphaAnd &= img[i+3];
            }
            var gotAlpha = (alphaAnd)!=255;

            var cmap={}, plte=[];  if(bufs.length!=0) {  cmap[0]=0;  plte.push(0);  if(ps!=0) ps--;  }


            if(ps!=0) {
                var qres = UPNG.quantize(bufs, ps, forGIF);  bufs = qres.bufs;
                for(var i=0; i<qres.plte.length; i++) {  var c=qres.plte[i].est.rgba;  if(cmap[c]==null) {  cmap[c]=plte.length;  plte.push(c);  }     }
            }
            else {
                // what if ps==0, but there are <=256 colors?  we still need to detect, if the palette could be used
                for(var j=0; j<bufs.length; j++)  {  // when not quantized, other frames can contain colors, that are not in an initial frame
                    var img32 = new Uint32Array(bufs[j]), ilen = img32.length;
                    for(var i=0; i<ilen; i++) {
                        var c = img32[i];
                        if((i<w || (c!=img32[i-1] && c!=img32[i-w])) && cmap[c]==null) {  cmap[c]=plte.length;  plte.push(c);  if(plte.length>=300) break;  }
                    }
                }
            }

            var brute = gotAlpha ? forGIF : false;		// brute : frames can only be copied, not "blended"
            var cc=plte.length;  //console.log(cc);
            if(cc<=256 && forbidPlte==false) {
                if(cc<= 2) depth=1;  else if(cc<= 4) depth=2;  else if(cc<=16) depth=4;  else depth=8;
                if(forGIF) depth=8;
                gotAlpha = true;
            }


            var frms = [];
            for(var j=0; j<bufs.length; j++)
            {
                var cimg = new Uint8Array(bufs[j]), cimg32 = new Uint32Array(cimg.buffer);

                var nx=0, ny=0, nw=w, nh=h, blend=0;
                if(j!=0 && !brute) {
                    var tlim = (forGIF || j==1 || frms[frms.length-2].dispose==2)?1:2, tstp = 0, tarea = 1e9;
                    for(var it=0; it<tlim; it++)
                    {
                        var pimg = new Uint8Array(bufs[j-1-it]), p32 = new Uint32Array(bufs[j-1-it]);
                        var mix=w,miy=h,max=-1,may=-1;
                        for(var y=0; y<h; y++) for(var x=0; x<w; x++) {
                            var i = y*w+x;
                            if(cimg32[i]!=p32[i]) {
                                if(x<mix) mix=x;  if(x>max) max=x;
                                if(y<miy) miy=y;  if(y>may) may=y;
                            }
                        }
                        var sarea = (max==-1) ? 1 : (max-mix+1)*(may-miy+1);
                        if(sarea<tarea) {
                            tarea = sarea;  tstp = it;
                            if(max==-1) {  nx=ny=0;  nw=nh=1;  }
                            else {  nx = mix; ny = miy; nw = max-mix+1; nh = may-miy+1;  }
                        }
                    }

                    var pimg = new Uint8Array(bufs[j-1-tstp]);
                    if(tstp==1) frms[frms.length-1].dispose = 2;

                    var nimg = new Uint8Array(nw*nh*4), nimg32 = new Uint32Array(nimg.buffer);
                    UPNG.   _copyTile(pimg,w,h, nimg,nw,nh, -nx,-ny, 0);
                    if(UPNG._copyTile(cimg,w,h, nimg,nw,nh, -nx,-ny, 3)) {
                        UPNG._copyTile(cimg,w,h, nimg,nw,nh, -nx,-ny, 2);  blend = 1;
                    }
                    else {
                        UPNG._copyTile(cimg,w,h, nimg,nw,nh, -nx,-ny, 0);  blend = 0;
                    }
                    cimg = nimg;  cimg32 = new Uint32Array(cimg.buffer);
                }
                var bpl = 4*nw;
                if(cc<=256 && forbidPlte==false) {
                    bpl = Math.ceil(depth*nw/8);
                    var nimg = new Uint8Array(bpl*nh);
                    for(var y=0; y<nh; y++) {  var i=y*bpl, ii=y*nw;
                        if     (depth==8) for(var x=0; x<nw; x++) nimg[i+(x)   ]   =  (cmap[cimg32[ii+x]]             );
                        else if(depth==4) for(var x=0; x<nw; x++) nimg[i+(x>>1)]  |=  (cmap[cimg32[ii+x]]<<(4-(x&1)*4));
                        else if(depth==2) for(var x=0; x<nw; x++) nimg[i+(x>>2)]  |=  (cmap[cimg32[ii+x]]<<(6-(x&3)*2));
                        else if(depth==1) for(var x=0; x<nw; x++) nimg[i+(x>>3)]  |=  (cmap[cimg32[ii+x]]<<(7-(x&7)*1));
                    }
                    cimg=nimg;  ctype=3;  bpp=1;
                }
                else if(gotAlpha==false && bufs.length==1) {	// some next "reduced" frames may contain alpha for blending
                    var nimg = new Uint8Array(nw*nh*3), area=nw*nh;
                    for(var i=0; i<area; i++) { var ti=i*3, qi=i*4;  nimg[ti]=cimg[qi];  nimg[ti+1]=cimg[qi+1];  nimg[ti+2]=cimg[qi+2];  }
                    cimg=nimg;  ctype=2;  bpp=3;  bpl=3*nw;
                }
                frms.push({rect:{x:nx,y:ny,width:nw,height:nh}, img:cimg, bpl:bpl, bpp:bpp, blend:blend, dispose:brute?1:0});
            }
            return {ctype:ctype, depth:depth, plte:plte, gotAlpha:gotAlpha, frames:frms  };
        }

        UPNG.encode._filterZero = function(img,h,bpp,bpl,data)
        {
            var fls = [];
            for(var t=0; t<5; t++) {  if(h*bpl>500000 && (t==2 || t==3 || t==4)) continue;
                for(var y=0; y<h; y++) UPNG.encode._filterLine(data, img, y, bpl, bpp, t);
                fls.push(pako["deflate"](data));  if(bpp==1) break;
            }
            var ti, tsize=1e9;
            for(var i=0; i<fls.length; i++) if(fls[i].length<tsize) {  ti=i;  tsize=fls[i].length;  }
            return fls[ti];
        }
        UPNG.encode._filterLine = function(data, img, y, bpl, bpp, type)
        {
            var i = y*bpl, di = i+y, paeth = UPNG.decode._paeth
            data[di]=type;  di++;

            if(type==0) for(var x=0; x<bpl; x++) data[di+x] = img[i+x];
            else if(type==1) {
                for(var x=  0; x<bpp; x++) data[di+x] =  img[i+x];
                for(var x=bpp; x<bpl; x++) data[di+x] = (img[i+x]-img[i+x-bpp]+256)&255;
            }
            else if(y==0) {
                for(var x=  0; x<bpp; x++) data[di+x] = img[i+x];

                if(type==2) for(var x=bpp; x<bpl; x++) data[di+x] = img[i+x];
                if(type==3) for(var x=bpp; x<bpl; x++) data[di+x] = (img[i+x] - (img[i+x-bpp]>>1) +256)&255;
                if(type==4) for(var x=bpp; x<bpl; x++) data[di+x] = (img[i+x] - paeth(img[i+x-bpp], 0, 0) +256)&255;
            }
            else {
                if(type==2) { for(var x=  0; x<bpl; x++) data[di+x] = (img[i+x]+256 - img[i+x-bpl])&255;  }
                if(type==3) { for(var x=  0; x<bpp; x++) data[di+x] = (img[i+x]+256 - (img[i+x-bpl]>>1))&255;
                    for(var x=bpp; x<bpl; x++) data[di+x] = (img[i+x]+256 - ((img[i+x-bpl]+img[i+x-bpp])>>1))&255;  }
                if(type==4) { for(var x=  0; x<bpp; x++) data[di+x] = (img[i+x]+256 - paeth(0, img[i+x-bpl], 0))&255;
                    for(var x=bpp; x<bpl; x++) data[di+x] = (img[i+x]+256 - paeth(img[i+x-bpp], img[i+x-bpl], img[i+x-bpp-bpl]))&255;  }
            }
        }

        UPNG.crc = {
            table : ( function() {
                var tab = new Uint32Array(256);
                for (var n=0; n<256; n++) {
                    var c = n;
                    for (var k=0; k<8; k++) {
                        if (c & 1)  c = 0xedb88320 ^ (c >>> 1);
                        else        c = c >>> 1;
                    }
                    tab[n] = c;  }
                return tab;  })(),
            update : function(c, buf, off, len) {
                for (var i=0; i<len; i++)  c = UPNG.crc.table[(c ^ buf[off+i]) & 0xff] ^ (c >>> 8);
                return c;
            },
            crc : function(b,o,l)  {  return UPNG.crc.update(0xffffffff,b,o,l) ^ 0xffffffff;  }
        }


        UPNG.quantize = function(bufs, ps, roundAlpha)
        {
            var imgs = [], totl = 0;
            for(var i=0; i<bufs.length; i++) {  imgs.push(UPNG.encode.alphaMul(new Uint8Array(bufs[i]), roundAlpha));  totl+=bufs[i].byteLength;  }

            var nimg = new Uint8Array(totl), nimg32 = new Uint32Array(nimg.buffer), noff=0;
            for(var i=0; i<imgs.length; i++) {
                var img = imgs[i], il = img.length;
                for(var j=0; j<il; j++) nimg[noff+j] = img[j];
                noff += il;
            }

            var root = {i0:0, i1:nimg.length, bst:null, est:null, tdst:0, left:null, right:null };  // basic statistic, extra statistic
            root.bst = UPNG.quantize.stats(  nimg,root.i0, root.i1  );  root.est = UPNG.quantize.estats( root.bst );
            var leafs = [root];

            while(leafs.length<ps)
            {
                var maxL = 0, mi=0;
                for(var i=0; i<leafs.length; i++) if(leafs[i].est.L > maxL) {  maxL=leafs[i].est.L;  mi=i;  }
                if(maxL<1e-3) break;
                var node = leafs[mi];

                var s0 = UPNG.quantize.splitPixels(nimg,nimg32, node.i0, node.i1, node.est.e, node.est.eMq255);

                var ln = {i0:node.i0, i1:s0, bst:null, est:null, tdst:0, left:null, right:null };  ln.bst = UPNG.quantize.stats( nimg, ln.i0, ln.i1 );
                ln.est = UPNG.quantize.estats( ln.bst );
                var rn = {i0:s0, i1:node.i1, bst:null, est:null, tdst:0, left:null, right:null };  rn.bst = {R:[], m:[], N:node.bst.N-ln.bst.N};
                for(var i=0; i<16; i++) rn.bst.R[i] = node.bst.R[i]-ln.bst.R[i];
                for(var i=0; i< 4; i++) rn.bst.m[i] = node.bst.m[i]-ln.bst.m[i];
                rn.est = UPNG.quantize.estats( rn.bst );

                node.left = ln;  node.right = rn;
                leafs[mi]=ln;  leafs.push(rn);
            }
            leafs.sort(function(a,b) {  return b.bst.N-a.bst.N;  });

            for(var ii=0; ii<imgs.length; ii++) {
                var planeDst = UPNG.quantize.planeDst;
                var sb = new Uint8Array(imgs[ii].buffer), tb = new Uint32Array(imgs[ii].buffer), len = sb.length;

                var stack = [], si=0;
                for(var i=0; i<len; i+=4) {
                    var r=sb[i]*(1/255), g=sb[i+1]*(1/255), b=sb[i+2]*(1/255), a=sb[i+3]*(1/255);

                    //  exact, but too slow :(
                    //var nd = UPNG.quantize.getNearest(root, r, g, b, a);
                    var nd = root;
                    while(nd.left) nd = (planeDst(nd.est,r,g,b,a)<=0) ? nd.left : nd.right;

                    tb[i>>2] = nd.est.rgba;
                }
                imgs[ii]=tb.buffer;
            }
            return {  bufs:imgs, plte:leafs  };
        }
        UPNG.quantize.getNearest = function(nd, r,g,b,a)
        {
            if(nd.left==null) {  nd.tdst = UPNG.quantize.dist(nd.est.q,r,g,b,a);  return nd;  }
            var planeDst = UPNG.quantize.planeDst(nd.est,r,g,b,a);

            var node0 = nd.left, node1 = nd.right;
            if(planeDst>0) {  node0=nd.right;  node1=nd.left;  }

            var ln = UPNG.quantize.getNearest(node0, r,g,b,a);
            if(ln.tdst<=planeDst*planeDst) return ln;
            var rn = UPNG.quantize.getNearest(node1, r,g,b,a);
            return rn.tdst<ln.tdst ? rn : ln;
        }
        UPNG.quantize.planeDst = function(est, r,g,b,a) {  var e = est.e;  return e[0]*r + e[1]*g + e[2]*b + e[3]*a - est.eMq;  }
        UPNG.quantize.dist     = function(q,   r,g,b,a) {  var d0=r-q[0], d1=g-q[1], d2=b-q[2], d3=a-q[3];  return d0*d0+d1*d1+d2*d2+d3*d3;  }

        UPNG.quantize.splitPixels = function(nimg, nimg32, i0, i1, e, eMq)
        {
            var vecDot = UPNG.quantize.vecDot;
            i1-=4;
            var shfs = 0;
            while(i0<i1)
            {
                while(vecDot(nimg, i0, e)<=eMq) i0+=4;
                while(vecDot(nimg, i1, e)> eMq) i1-=4;
                if(i0>=i1) break;

                var t = nimg32[i0>>2];  nimg32[i0>>2] = nimg32[i1>>2];  nimg32[i1>>2]=t;

                i0+=4;  i1-=4;
            }
            while(vecDot(nimg, i0, e)>eMq) i0-=4;
            return i0+4;
        }
        UPNG.quantize.vecDot = function(nimg, i, e)
        {
            return nimg[i]*e[0] + nimg[i+1]*e[1] + nimg[i+2]*e[2] + nimg[i+3]*e[3];
        }
        UPNG.quantize.stats = function(nimg, i0, i1){
            var R = [0,0,0,0,  0,0,0,0,  0,0,0,0,  0,0,0,0];
            var m = [0,0,0,0];
            var N = (i1-i0)>>2;
            for(var i=i0; i<i1; i+=4)
            {
                var r = nimg[i]*(1/255), g = nimg[i+1]*(1/255), b = nimg[i+2]*(1/255), a = nimg[i+3]*(1/255);
                //var r = nimg[i], g = nimg[i+1], b = nimg[i+2], a = nimg[i+3];
                m[0]+=r;  m[1]+=g;  m[2]+=b;  m[3]+=a;

                R[ 0] += r*r;  R[ 1] += r*g;  R[ 2] += r*b;  R[ 3] += r*a;
                R[ 5] += g*g;  R[ 6] += g*b;  R[ 7] += g*a;
                R[10] += b*b;  R[11] += b*a;
                R[15] += a*a;
            }
            R[4]=R[1];  R[8]=R[2];  R[12]=R[3];  R[9]=R[6];  R[13]=R[7];  R[14]=R[11];

            return {R:R, m:m, N:N};
        }
        UPNG.quantize.estats = function(stats){
            var R = stats.R, m = stats.m, N = stats.N;

            var m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3], iN = (N==0 ? 0 : 1/N);
            var Rj = [
                R[ 0] - m0*m0*iN,  R[ 1] - m0*m1*iN,  R[ 2] - m0*m2*iN,  R[ 3] - m0*m3*iN,
                R[ 4] - m1*m0*iN,  R[ 5] - m1*m1*iN,  R[ 6] - m1*m2*iN,  R[ 7] - m1*m3*iN,
                R[ 8] - m2*m0*iN,  R[ 9] - m2*m1*iN,  R[10] - m2*m2*iN,  R[11] - m2*m3*iN,
                R[12] - m3*m0*iN,  R[13] - m3*m1*iN,  R[14] - m3*m2*iN,  R[15] - m3*m3*iN
            ];

            var A = Rj, M = UPNG.M4;
            var b = [0.5,0.5,0.5,0.5], mi = 0, tmi = 0;

            if(N!=0)
                for(var i=0; i<10; i++) {
                    b = M.multVec(A, b);  tmi = Math.sqrt(M.dot(b,b));  b = M.sml(1/tmi,  b);
                    if(Math.abs(tmi-mi)<1e-9) break;  mi = tmi;
                }
            //b = [0,0,1,0];  mi=N;
            var q = [m0*iN, m1*iN, m2*iN, m3*iN];
            var eMq255 = M.dot(M.sml(255,q),b);

            var ia = (q[3]<0.001) ? 0 : 1/q[3];

            return {  Cov:Rj, q:q, e:b, L:mi,  eMq255:eMq255, eMq : M.dot(b,q),
                rgba: (((Math.round(255*q[3])<<24) | (Math.round(255*q[2]*ia)<<16) |  (Math.round(255*q[1]*ia)<<8) | (Math.round(255*q[0]*ia)<<0))>>>0)  };
        }
        UPNG.M4 = {
            multVec : function(m,v) {
                return [
                    m[ 0]*v[0] + m[ 1]*v[1] + m[ 2]*v[2] + m[ 3]*v[3],
                    m[ 4]*v[0] + m[ 5]*v[1] + m[ 6]*v[2] + m[ 7]*v[3],
                    m[ 8]*v[0] + m[ 9]*v[1] + m[10]*v[2] + m[11]*v[3],
                    m[12]*v[0] + m[13]*v[1] + m[14]*v[2] + m[15]*v[3]
                ];
            },
            dot : function(x,y) {  return  x[0]*y[0]+x[1]*y[1]+x[2]*y[2]+x[3]*y[3];  },
            sml : function(a,y) {  return [a*y[0],a*y[1],a*y[2],a*y[3]];  }
        }

        UPNG.encode.alphaMul = function(img, roundA) {
            var nimg = new Uint8Array(img.length), area = img.length>>2;
            for(var i=0; i<area; i++) {
                var qi=i<<2, ia=img[qi+3];
                if(roundA) ia = ((ia<128))?0:255;
                var a = ia*(1/255);
                nimg[qi+0] = img[qi+0]*a;  nimg[qi+1] = img[qi+1]*a;  nimg[qi+2] = img[qi+2]*a;  nimg[qi+3] = ia;
            }
            return nimg;
        }








    })(UPNG, pako);
})();

let JPG = {
    encode:encode,
    decode:decode,
}
function arrayBufferToBase64(buffer) {
    // 创建一个视图（View）来访问ArrayBuffer中的数据
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;

    // 遍历Uint8Array并构建二进制字符串
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    // 使用btoa函数将二进制字符串编码为Base64字符串
    return window.btoa(binary);
}
function base64ToArrayBuffer(base64) {
    // 移除Base64字符串中的URL安全字符（如果有的话），并替换掉Base64的填充字符'='
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const base64WithoutPadding = (base64 + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    // 使用atob解码Base64字符串为二进制字符串
    const binaryString = window.atob(base64WithoutPadding);

    // 创建一个Uint8Array来存储二进制数据
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    // 遍历二进制字符串，并将每个字符转换为其对应的字节值
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
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
    static Type = 0;
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
            let img_info = PNG.decode(base64ToArrayBuffer(image_data.base64))
            this.width = img_info.width;
            this.height = img_info.height;
            let imageData = PNG.toRGBA8.decodeImage(img_info.data, img_info.width, img_info.height, img_info);
            return new Uint8ClampedArray(imageData.buffer)
        }
        else if (image_data.base64.startsWith('/9j/')) {
            let decode = JPG.decode(base64ToArrayBuffer(image_data.base64),{useTArray:true,formatAsRGBA:true,tolerantDecoding:true});
            this.width = decode.width;
            this.height = decode.height;
            return new Uint8ClampedArray(decode.data);
        } else {
            throw new Error("仅支持png,jpg类型图片")
        }
    }
    _getOutputSteam(quality) {
        if (Image.Type === 0){
            let bufferRawImageData = JPG.encode({width:this.width,height:this.height,data:this.imageData,comments:undefined},quality);
            return bufferRawImageData.data;
        }else if (Image.Type === 1)
            return PNG.encode([this.imageData.buffer], this.width, this.height, 0);
        else return null;
    }
    toBase64(quality = 50) {
        let imageData = this._getOutputSteam(quality);
        return arrayBufferToBase64(imageData);
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
console.log("当前Image.js版本：1.0.3")
export default Image;


