<!-- 尚未修改 -->
<template>
  <v-container style="max-width: none">
    <ButtonsCRUDP
      :add="() => setMode('add')"
      :isAddDisabled="isAddDisabled"
      :edit="() => setMode('edit')"
      :isEditDisabled="isEditDisabled"
      :deleteOrder="deleteOrder"
      :isDeleteOrderDisabled="isDeleteOrderDisabled"
      :toggleAudit="toggleAudit"
      :isToggleAuditDisabled="isToggleAuditDisabled"
      :exportExcel="exportExcel"
      :isExportExcelDisabled="isExportExcelDisabled"
      :isButtonsCRUDPVisible="mode === 'view'"
    />
    <ButtonsSaveDiscard
      :save="save"
      :isSaveDisabled="isOtherFieldDisabled"
      :discard="() => setMode('view')"
      :isButtonsSaveDiscardVisible="mode !== 'view'"
    />
    <!-- mst表單區塊 -->
    <v-card>
      <v-card-text>
        <v-row v-for="(row, rowIndex) in formRows" :key="rowIndex">
          <template v-for="field in row" :key="field.column">
            <v-col :cols="field.cols">
              <template v-if="field.componentType === 'button'">
                <v-btn
                  color="primary"
                  width="100%"
                  height="56px"
                  :disabled="field.disabled ? field.disabled() : false"
                  @click="field.onClick"
                >
                  {{ field.name }}
                </v-btn>
              </template>
              <template v-else>
                <component
                  :is="
                    field.componentType === 'checkbox'
                      ? 'v-checkbox'
                      : field.componentType === 'select'
                      ? 'v-select'
                      : 'v-text-field'
                  "
                  v-model="form[field.column]"
                  :label="field.name"
                  :readonly="
                    isReadonly(
                      field.inputType,
                      field.isEditable,
                      field.componentType
                    )
                  "
                  :style="{ backgroundColor: INPUT_COLOR[field.inputType] }"
                  v-bind="
                    field.componentType === 'checkbox'
                      ? {
                          disabled: isReadonly(
                            field.inputType,
                            field.isEditable,
                            field.componentType
                          ),
                        }
                      : field.componentType === 'select'
                      ? {
                          'item-title': field.column,
                          'item-value': field.column,
                          items: formSelectOptions[field.column].value,
                        }
                      : field.componentType === 'date'
                      ? { type: 'date' }
                      : {}
                  "
                />
              </template>
            </v-col>
          </template>
        </v-row>

        <!-- ...的小視窗 -->
        <SupplyDialog
          :dialog="dialog"
          @update:dialog="dialog = $event"
          :supplyQuery="supplyQuery"
          @update:supplyQuery="supplyQuery = $event"
          :tempSupplykind="tempSupplykind"
          @update:tempSupplykind="tempSupplykind = $event"
          :spkindnoOptionsWithEmpty="spkindnoOptionsWithEmpty"
          :filteredSuppliers="filteredSuppliers"
          @handleInputSupplyQueryAndTempSupplykind="
            handleInputSupplyQueryAndTempSupplykind
          "
          @selectSupplier="selectSupplier"
        ></SupplyDialog>
        <!-- 材料的小視窗 -->
        <SpDialog
          :isSpDialogVisible="isSpDialogVisible"
          @update:isSpDialogVisible="isSpDialogVisible = $event"
          :spQuery="spQuery"
          @update:spQuery[spno]="spQuery.spno = $event"
          @update:spQuery[spspec]="spQuery.spspec = $event"
          @update:spQuery[matno]="spQuery.matno = $event"
          @update:spQuery[spunit]="spQuery.spunit = $event"
          :spFiltered="spFiltered"
          @handleInputSpQuery="
            handleInputSpQuery
          "
          @selectSp="selectSp"
        ></SpDialog>
        <!-- 輔料價格的小視窗 -->
        <ClpriceDialog
          :isClpriceDialogVisible="isClpriceDialogVisible"
          @update:isClpriceDialogVisible="isClpriceDialogVisible = $event"
          :clpriceQuery="clpriceQuery"
          :clprice="clprice"
          @selectClprice="selectClprice"
        ></ClpriceDialog>
        <!-- 原材料價格的小視窗 -->
        <GclpriceDialog
          :isGclpriceDialogVisible="isGclpriceDialogVisible"
          @update:isGclpriceDialogVisible="isGclpriceDialogVisible = $event"
          :gclpriceQuery="gclpriceQuery"
          :gclprice="gclprice"
          @selectGclprice="selectGclprice"
          :priceType="priceType"
          @update:priceType="priceType=$event"
          ></GclpriceDialog>
      </v-card-text>
    </v-card>

    <!-- 查詢結果顯示區塊：自定義 header 插槽 -->
    <!-- disable-pagination 停用分頁功能 
      hide-default-footer 隱藏預設的頁尾 
      items-per-page="-1" 顯示所有資料
      fixed-header 固定表頭
       -->
    <v-card class="mt-4">
      <v-data-table
        :headers="displayHeaders"
        :items="results"
        disable-pagination
        hide-default-footer
        :items-per-page="-1"
        no-data-text="No data available"
        style="max-height: 400px; overflow-y: auto"
        fixed-header
        height="400px"
      >
        <!-- 自定義 header 插槽，強制渲染表頭 -->
        <template v-slot:header>
          <thead>
            <tr>
              <th v-for="header in displayHeaders" :key="header.key">
                {{ header.title }}
              </th>
            </tr>
          </thead>
        </template>

        <!-- 自定義每一行資料 -->
        <template v-slot:item="{ item }">
          <v-hover v-slot:default="{ isHovering, props: hoverProps }">
            <tr
              v-bind="hoverProps"
              :style="isHovering ? { backgroundColor: '#f5f5f5' } : {}"
            >
              <!-- 編輯按鈕(筆或勾勾)和刪除按鈕 -->
              <template v-if="mode !== 'view'">
                <td :style="{ 'font-size': '24px' }">
                  <v-btn icon @click="editItem(item)">
                    <v-icon>{{ getEditIcon(item) }}</v-icon>
                  </v-btn>
                </td>
                <td :style="{ 'font-size': '24px' }">
                  <v-btn icon @click="deleteRow(item)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>
              </template>
              <!-- 使用迴圈動態生成表格的欄位 -->
               <!-- 用v-if和v-else-if做特殊處理 -->
              <template v-for="header in headers" :key="header.key">
                <td
                  v-if="header.key === 'header.cldhditm.pcs'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                 <v-text-field
                    v-model="item[header.key]"
                    :readonly="!item.isEditCldhditmClicked"
                    @change="utils.handleField(item, header.key);"
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.cldhditm.payno'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  <v-select
                    v-model="item[header.key]"
                    item-title = "payno"
                    item-value = "payno"
                    :items="paynoOptions.map((item) => item.payno)"
                    :readonly="!item.isEditCldhditmClicked"
                  ></v-select>
                </td>
                <td
                  v-else-if="header.key === 'header.cldhditm.price'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    @dblclick="!item.isEditCldhditmClicked
                      ? null
                      : spkindno === 3
                      ? openGclpriceDialog(item)
                      : openClpriceDialog(item)"
                    :readonly="true"
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.cldhditm.gdate'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    type="date"
                    :readonly="!item.isEditCldhditmClicked"
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.cldhditm.note'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  <v-text-field 
                    v-model="item[header.key]"
                    :readonly="!item.isEditCldhditmClicked"
                    :size="item[header.key]? item[header.key].length: 1"
                  ></v-text-field>
                </td>
                <td
                  v-else
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  {{ item[header.key] }}
                </td>
              </template>
            </tr>
          </v-hover>
        </template>
        <!-- 底部的加總欄位 -->
        <template v-slot:tfoot>
          <tr>
            <!-- 使用迴圈動態生成需要加總的欄位 -->
            <template v-for="header in displayHeaders" :key="header.key">
              <td
                v-if="columnsForSum.includes(header.key)"
                :style="{ backgroundColor: INPUT_COLOR['fixed'] }"
              >
                {{ utils.calculateColumnSum(results, header.key) }}
              </td>
              <td v-else :style="{ backgroundColor: INPUT_COLOR['fixed'] }">
                <!-- 不需要加總的欄位保持空白 -->
              </td>
            </template>
          </tr>
        </template>
      </v-data-table>
      <!-- 下方的加號 -->
      <template v-if="mode !== 'view'">
        <div class="container">
          <v-btn
            class="plus-button"
            color="primary"
            @click="() => openSpDialog()"
            :disabled="form.supplyno === ''"
          >+</v-btn>
        </div>
      </template>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from "vue";
import { useRouter } from "vue-router";
import { INPUT_COLOR } from "@/config.js";
import { API_BASE_URL } from "@/config.js";
import * as utils from "@/utils/utils.js";
import ButtonsCRUDP from "@/components/ButtonsCRUDP.vue";
import ButtonsSaveDiscard from "@/components/ButtonsSaveDiscard.vue";
import SupplyDialog from "@/components/SupplyDialog.vue";
import SpDialog from "@/components/SpDialog.vue";
import * as XLSX from "xlsx";
import { useCheckButtonFlags } from "@/composables/useCheckButtonFlags.js";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";
import { useJhpcsJhkgValidate } from "@/composables/useJhpcsJhkgValidate.js";
import { useSupplyDialog } from "@/composables/useSupplyDialog.js";
import ClpriceDialog from "@/components/ClpriceDialog.vue";
import GclpriceDialog from "@/components/GclpriceDialog.vue";

const props = defineProps({
  danno: String,
}); // 從url接收
const selectedLanguage = inject("selectedLanguage");
const router = useRouter();

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);

// 上方的欄位
const form = reactive({
  supplyno: "", // 供方編碼
  danno: props.danno, // 訂購單號, 從url接收
  supplyname: "", // 供方名稱
  ddate: "", // 收貨日期
  demo: "", // 備註
  maker: "", // 制單
  audit: "", // 審核
});

const spkindname = ref(""); // 在網頁版, spkindname與供方類別對應
const spkindno = ref(""); // 類別編碼

const spkindnoOptions = ref([]); // 收貨類別選項
const spkindnoOptionsWithEmpty = computed(() => {
  return [{ spkindno: "", spkindname: "" }, ...spkindnoOptions.value];
}); // 在收貨類別選項中加入「不設限」選項

const {
  dialog,
  supplyQuery,
  tempSupplykind,
  filteredSuppliers,
  openDialog,
  handleInputSupplyQueryAndTempSupplykind,
} = useSupplyDialog(); // ...視窗的狀態和方法

const selectSupplier = async (supplier) => {
  // 選取供方
  form.supplyno = supplier["header.supply.supplyno"];
  form.supplyname = supplier["header.supply.supplyname"];
  spkindname.value = supplier["header.supply.supplykind"]; // 在網頁版, spkindname與供方類別對應
  console.log("選取的供方：", spkindname.value);
  if (spkindname.value === null || spkindname.value === "") {
    spkindno.value = ""; // 沒有對應的類別編碼
  } else {
    spkindno.value =  spkindnoOptions.value.find(
      (item) => item.spkindname === spkindname.value
    ).spkindno; // 類別編碼
  }

  //  取得流水號(danno)
  const params = {
    prefix: `D_${form.supplyno}`,
    table: "cldhdmst",
  };
  const data = await utils.fetchData(
    "cljhdDetailsAddGetCljhdDanno.php",
    params
  ); // php的名字應該改成 getDannoSerial.php
  form.danno = data[0].NewDanno;

  dialog.value = false; // 關閉...視窗
  openSpDialog(); // 打開材料查詢介面
};

const isSpDialogVisible = ref(false); // 材料的小視窗的顯示狀態
const spQuery = reactive({
  spno: "",
  spspec: "",
  matno: "",
  spunit: "",
  spkindname: "",
}); // 材料查詢條件
const sp = ref([]); // 材料查詢結果
const spFiltered = ref([]); // 過濾過的材料查詢結果

const  openSpDialog = async ()  => {
  // 打開材料查詢介面

  // 每次材料查詢介面打開時，需清空查詢欄位，否則會殘留前次輸入的內容
  spQuery.spno = "";
  spQuery.spspec = "";
  spQuery.matno = "";
  spQuery.spunit = "";
  spQuery.spkindname = spkindname.value;

  // 調用訂單查詢
  if (!form.supplyno) {
    console.error("供方編碼為空");
  } else {
    const params = {
      spkindno: spkindno.value,
      supplyno: form.supplyno,
    };
    sp.value = await utils.fetchData("sp.php", params);
    console.log("材料查詢結果：", sp.value);
  }
  spFiltered.value = sp.value; // 初始化材料列表
  isSpDialogVisible.value = true; // 打開材料查詢介面
}
const handleInputSpQuery = () => {
  console.log("spQuery:", spQuery);
  // 處理材料查詢, 根據查詢條件過濾材料列表
  if (
    spQuery.spno.trim() === "" &&
    spQuery.spspec.trim() === "" &&
    spQuery.matno.trim() === "" &&
    spQuery.spunit.trim() === ""
  ) {
    spFiltered.value = sp.value;
  } else {
    spFiltered.value = sp.value.filter(
      (item) =>
        (spQuery.spno.trim() === "" ||
          (item["header.sp.spno"] &&
            item["header.sp.spno"]
              .toUpperCase()
              .includes(spQuery.spno.toUpperCase()))) &&
        (spQuery.spspec.trim() === "" ||
          (item["header.sp.spspec"] &&
            item["header.sp.spspec"]
              .toUpperCase()
              .includes(spQuery.spspec.toUpperCase()))) &&
        (spQuery.matno.trim() === "" ||
          (item["header.sp.matno"] &&
            item["header.sp.matno"]
              .toUpperCase()
              .includes(spQuery.matno.toUpperCase()))) &&
        (spQuery.spunit.trim() === "" ||
          (item["header.sp.spunit"] &&
            item["header.sp.spunit"]
              .toUpperCase()
              .includes(spQuery.spunit.toUpperCase())))
    );
  }
  console.log("spFiltered:", spFiltered.value);
};
const selectSp = async (item) => {
  // 選取材料
  console.log("選取的材料：", item);
  let tempItem = {};
  tempItem["header.cldhditm.id"] = ++IdCurrent.value; // 新增一行的 id
  tempItem["header.cldhditm.danid"] = `${form.danno}_${IdCurrent.value}`; // 訂單號碼
  tempItem["header.cldhditm.spno"] = item["header.sp.spno"]; // 材料編碼
  tempItem["header.sp.spspec"] = item["header.sp.spspec"]; // 規格
  tempItem["header.sp.spcd"] = item["header.sp.spcd"]; // 產地
  tempItem["header.sp.spunit"] = item["header.sp.spunit"]; // 單位
  tempItem["header.cldhditm.payno"] = item.payno; // 幣別
  tempItem.clkind = item.clkind; // 材料類別(不可見)
  // 單價
  if (spkindno.value === 3) {
    if (item.clkind === '卷料') {
      console.log("卷料價格");
      if (item.pricekg1 > 0 || item.pricekg2 > 0) {
        tempItem["header.cldhditm.price"] = "";
      } else {
        tempItem["header.cldhditm.price"] = item.pricekg; 
      }
    } else {
      if (item.price1 > 0 || item.price2 > 0) {
        tempItem["header.cldhditm.price"] = "";
      } else {
        tempItem["header.cldhditm.price"] = item.price;
      }
    }
  } else {
    tempItem["header.cldhditm.price"] = item.price;
  }
  tempItem.isEditCldhditmClicked = true;
  
  console.log("tempItem:", tempItem);
  results.value.push(tempItem); // 新增一行
  isSpDialogVisible.value = false; // 關閉材料查詢視窗
};

let selecrRow = null; // 用來存儲選取的行
//  輔料價格的小視窗的狀態和方法
const isClpriceDialogVisible = ref(false); // 輔料價格的小視窗的顯示狀態
const clpriceQuery = reactive({
  supplyno: "",
  spno: "",
}); // 輔料價格查詢條件
const clprice = ref([]); // 輔料價格查詢結果

const openClpriceDialog = async (item) => {
  // 打開輔料價格查詢介面
  selecrRow = item; // 儲存選取的行
  if (!form.supplyno) {
    console.error("供方編碼為空");
  } else {
    clpriceQuery.supplyno = form.supplyno; // 供方編碼
    clpriceQuery.spno = item["header.cldhditm.spno"]; // 材料編碼
    const params = {
      supplyno: clpriceQuery.supplyno,
      spno: clpriceQuery.spno,
    };
    clprice.value = await utils.fetchData("clprice.php", params);
    clprice.value.forEach((item) => {
      item["header.clprice.ddate"] = item["header.clprice.ddate"].date.split(" ")[0]; // 將日期格式化為 YYYY-MM-DD
    });
    console.log("輔料價格查詢結果：", clprice.value);
  }
  isClpriceDialogVisible.value = true; // 打開輔料價格查詢介面
};

const selectClprice = (item) => {
  // 選取輔料價格
  console.log("選取的輔料價格：", item);
  selecrRow["header.cldhditm.price"] = item["header.clprice.price"]; // 單價
  isClpriceDialogVisible.value = false; // 關閉輔料價格查詢視窗
};

// 原材料價格的小視窗的狀態和方法
const isGclpriceDialogVisible = ref(false); // 原材料價格的小視窗的顯示狀態
const gclpriceQuery = reactive({
  supplyno: "",
  matno: "",
  hig: "",
  spcd: "",
  spunit: "",
}); // 原材料價格查詢條件
const gclprice = ref([]); // 原材料價格查詢結果
const priceType = ref(""); // 價格類型

const openGclpriceDialog = async (item) => {
  // 打開原材料價格查詢介面
  selecrRow = item; // 儲存選取的行
  if (!form.supplyno) {
    console.error("供方編碼為空");
  } else {
    gclpriceQuery.supplyno = form.supplyno; // 供方編碼
    gclpriceQuery.spunit = item["header.cldhditm.spunit"]; // 單位
    const params = {
      supplyno: gclpriceQuery.supplyno,
      spno: item["header.cldhditm.spno"], // 材料編碼
    };
    gclprice.value = await utils.fetchData("gclprice.php", params);
    gclprice.value.forEach((item) => {
      item["header.gclprice.ddate"] = item["header.gclprice.ddate"].date.split(" ")[0]; // 將日期格式化為 YYYY-MM-DD
    });
    console.log("原材料價格查詢結果：", gclprice.value);

    gclpriceQuery.matno = gclprice.value[0]["header.gclprice.matno"]; // 在php中用spno查詢sp取得
    gclpriceQuery.hig = gclprice.value[0]["header.gclprice.hig"]; // 在php中用spno查詢sp取得
    gclpriceQuery.spcd = item["header.sp.spcd"];
    gclpriceQuery.spunit = item["header.sp.spunit"];
    console.log("gclpriceQuery:", gclpriceQuery);
  }
  priceType.value = ""; // 清空價格類型
  isGclpriceDialogVisible.value = true; // 打開原材料價格查詢介面
};
const selectGclprice = (item) => {
  // 選取原材料價格
  console.log("選取的原材料價格：", item);

  // 填入單價欄位
  if (selecrRow.clkind === '卷料') {
    const priceTypeName = "header.gclprice.pricekg" + priceType.value;
    console.log("priceTypeName:", priceTypeName);
    if (item[priceTypeName] > 0) {
      selecrRow["header.cldhditm.price"] = item[priceTypeName]; 
    } else {
      alert("價格為0");
      return;
    }
  } else {
    const priceTypeName = "header.gclprice.price" + priceType.value;
    console.log("priceTypeName:", priceTypeName);
    if (item[priceTypeName] > 0) {
      selecrRow["header.cldhditm.price"] = item[priceTypeName];
    } else {
      alert("價格為0");
      return;
    }
  }
  
  isGclpriceDialogVisible.value = false; // 關閉原材料價格查詢視窗
};



const formSelectOptions = {}; // form中的所有選項

const results = ref([]); // 查詢結果(表格的內容)
const idLastInDB = ref("0"); // 最後一筆已儲存的row的 id 用來分隔原有的row和新增的row //
const IdCurrent = ref(0); // 目前最新的一筆row的 id

const reset = () => {
  // 重設所有欄位(原本會在initializeData中加載的變數)
  form.supplyno = "";
  form.danno = "";
  form.supplyname = "";
  form.ddate = "";
  form.demo = "";
  form.maker = "";
  form.audit = "";
  results.value = [];
  idLastInDB.value = "0"; // 重置最後一筆已儲存的row的 id
  IdCurrent.value = 0; // 重置目前最新的一筆row的 id
};

const paynoOptions = ref([]); // 幣別選項

const {
  jhpcsRefs,
  jhkgRefs,
  isJhpcsJhkgValid,
  handleJhpcsJhkgBlur,
  isOtherFieldDisabled,
} = useJhpcsJhkgValidate(results); // 用來驗證 jhpcs/jhkg 欄位是否已填寫

const orderInDBNum = ref(0); // 原本的行數 用來判斷是不是只剩一個row 是的話會在刪除此row後刪除整張收貨單

const mode = ref("view"); // 當前模式，默認為查看模式
const setMode = async (newMode) => {
  // 設定模式
  if (newMode === "add") {
    // 設定為新增模式
    reset(); // 重設所有欄位

    [form.ddate] = utils.getCurrentDateTime(); // 取得當前日期

    mode.value = "add";
  } else if (newMode === "edit") {
    // 設定為修改模式
    if (form.audit === null || form.audit === "") {
      mode.value = "edit";
    } else {
      alert("此單已審核，不能修改");
    }
  } else {
    // 設定為查看模式
    form.danno = props.danno;
    initializeData(); // 重新加載資料
    mode.value = "view";
  }
};

// 需要加總的欄位名稱
const columnsForSum = ref([
  "header.cldhditm.pcs",
  "header.cldhditm.kg",
  "header.cldhditm.pay",
  "header.cldhditm.getpcs",
]);

const displayHeaders = computed(() => {
  const currentHeaders = [...headers.value];
  if (mode.value !== "view") {
    currentHeaders.unshift({ title: "", key: "deleteButton" });
    currentHeaders.unshift({ title: "", key: "editButton" });
  }
  return currentHeaders;
}); // 加入編輯和刪除按鈕(以後的版本會把編輯按鈕移除)

const initializeData = async () => {
  // 加載表格內的資料
  const params = {
    danno: form.danno,
  };

  const data = await utils.fetchData("cldhdDetails.php", params); //透過api獲取資料
  console.log("查詢結果：", data);
  if (
    !data["cldhdmst"] ||
    data["cldhdmst"].length === 0 ||
    !data["cldhditm"] ||
    data["cldhditm"].length === 0
  ) {
    // 如果沒有資料, 設定顯示空白訂單

    // 只允許點擊新增按鈕, 其他按鈕禁用
    isAddDisabled.value = false;
    isEditDisabled.value = true;
    isDeleteOrderDisabled.value = true;
    isToggleAuditDisabled.value = true;

    reset(); // 重設所有欄位
    return; // 如果沒有資料，則不進行後續操作
  }

  // 接收查詢結果
  results.value = data["cldhditm"];
  results.value.forEach((item) => (item.isEditCldhditmClicked = false)); // 預設不可編輯

  // 轉換時間格式
  results.value.forEach((item) => {
    item["header.cldhditm.gdate"] = item["header.cldhditm.gdate"]
      ? item["header.cldhditm.gdate"].date.split(" ")[0]
      : "";
  });

  idLastInDB.value = data["cldhditm"].at(-1)["header.cldhditm.id"]; // 取得DB最後一筆的 id
  console.log("最後一筆的 id：", idLastInDB.value);
  IdCurrent.value = idLastInDB.value; // 設置目前的 id 為DB最後一筆的 id

  form.supplyno = data["cldhdmst"][0].supplyno;
  form.supplyname = data["cldhdmst"][0].supplyname;
  //form.danno = data["cldhdmst"][0].danno; // danno 由 url 接收
  form.ddate = data["cldhdmst"][0].ddate.date.split(" ")[0]; // 將日期格式化為 YYYY-MM-DD
  form.demo = data["cldhdmst"][0].demo;
  form.maker = data["cldhdmst"][0].maker;
  form.audit = data["cldhdmst"][0].audit;

  orderInDBNum.value = results.value.length; // 取得原本的行數
  console.log("results:", results.value);
  await checkButtonFlags(); // 檢查按鈕狀態
};

const save = async () => {
  // 存檔到資料庫
  /*
  // 檢查results是否為空
  if (results.value.length === 0) {
    alert("請先添加訂單資料");
    return;
  }

  if (mode.value === "edit") {
    console.log("更新資料庫中的mst");
    // 更新資料庫中的mst
    const params = {
      danno: form.danno,
      ckkind: form.ckkind,
      dannobase: form.dannobase,
      pjdno: form.pjdno,
      ddate: form.ddate,
      demo: form.demo,
    };
    //console.log("傳送 (Update MST):", params);
    const data = await utils.fetchData("cljhdDetailsUpdate.php", params); // 透過api獲取資料
    console.log("更新資料結果 (MST)：", data);
  }

  // 處理表格中新增的資料
  const itemsToBeAdded = results.value.filter(
    (item) => item["header.cldhditm.id"] > idLastInDB.value
  );

  if (itemsToBeAdded.length > 0) {
    // 只保存新增的row

    IdCurrent.value = idLastInDB.value; // 重頭計算id
    // 逐行新增
    for (let item of itemsToBeAdded) {
      const params = {
        ddate: form.ddate,
        supplyno: form.supplyno,
        pjdno: form.pjdno,
        ckkind: form.ckkind,
        spkindname: form.spkindname,
        qcnot: form.qcnot,
        danno: form.danno,
        dannobase: form.dannobase,
        demo: form.demo,
        id: ++IdCurrent.value, // 使用並遞增計數器
        dhdno: item["header.cljhditm.dhdno"],
        dhdid: item["header.cljhditm.dhdid"],
        spno: item["header.cljhditm.spno"],
        jhpcs: item["header.cljhditm.jhpcs"],
        jhkg: item["header.cljhditm.jhkg"],
      };

      //console.log("傳送 (Add ITM):", params);
      const data = await utils.fetchData("cljhdDetailsAdd.php", params); // 透過api獲取資料
      console.log("新增資料結果：", data);
    }
  }
  alert("存檔完成");

  if (mode.value === "add") {
    const url = {
      path: `/cljhdDetails/${form.danno}`,
    };
    await router.push(url); // 移動到新增的訂單的頁面
  }

  await setMode("view"); // 切換到查看模式
  */
};

const editItem = async (item) => {
  // 如果已經入庫則無法編輯
  /*
  // 編輯按鈕
  // row左側的編輯按鈕(筆或打勾的圖案)
  console.log("header.cljhditm.id", item["header.cljhditm.id"]);
  if (item["header.cljhditm.id"] <= idLastInDB.value) {
    console.log("Editing existing item, ID:", item["header.cljhditm.id"]);
    if (item.isEditCldhditmClicked) {
      // 儲存更新

      if (!isJhpcsJhkgValid(item)) {
        alert("請輸入暫收數量及暫收重量，且暫存數量不為0");
        return;
      }
      const params = {
        danno: form.danno,
        id: item["header.cljhditm.id"],
        jhpcs: item["header.cljhditm.jhpcs"],
        jhkg: item["header.cljhditm.jhkg"],
      };
      console.log("傳送 (Update Row):", params);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/cljhdDetailsUpdateRow.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // 憑證
            body: JSON.stringify(params),
          }
        );
        const data = await response.json();
        console.log("伺服器回傳內容 (Update Row):", data);
        alert("更新完成");
      } catch (error) {
        console.error("更新資料失敗 (Update Row)", error);
        alert("更新失敗");
      }
    }
    item.isEditCldhditmClicked = !item.isEditCldhditmClicked; // 切換編輯狀態
  } else {
    console.log(
      "Cannot edit newly added item before saving, ID:",
      item["header.cljhditm.id"]
    );
    // 對於新增的項目，編輯按鈕不需要做任何事
  }
  console.log("isEditCldhditmClicked", item.isEditCldhditmClicked);
  */
};

const getEditIcon = (item) => {
  // 編輯按鈕的圖示
  if (item["header.cldhditm.id"] <= idLastInDB.value) {
    if (item.isEditCldhditmClicked) {
      return "mdi-check";
    } else {
      return "mdi-pencil";
    }
  } else {
    // 新增的項目，在保存前可能不需要顯示編輯/保存圖標
    return ""; // 或者根據需求返回特定圖標
  }
};

const deleteRow = (item) => {
  // 刪行
  if (item["header.cldhditm.id"] <= idLastInDB.value) {
    if (false) {
      alert("此單已有入庫，不能刪除");
      return;
    } else {
      alert("執行刪除");
    }
  } else {
    // 刪除調用訂單新增的row
    const index = results.value.findIndex(
      (result) => result["header.cldhditm.id"] === item["header.cldhditm.id"]
    );
    if (index !== -1) {
      // 從 results 中移除該項
      results.value.splice(index, 1);
    } else {
      console.error("Item not found in results:", item);
    }
  }
};

const deleteOrder = async () => {
  /*
  // 廢單
  if (form.audit === null || form.audit === "") {
    if (confirm("您確定要刪除整張單據嗎?")) {
      try {
        for (let item of results.value) {
          await utils.cljhdDelete(form.danno, item["header.cljhditm.id"]);
        }
        alert("刪除完成");
        initializeData(); // 重新加載資料
      } catch (error) {
        console.error("刪除單據時發生錯誤:", error);
        alert("刪除失敗");
      }
    }
  } else {
    alert("此單已審核，不能刪除");
  }
    */
};

const toggleAudit = async () => {
  // 審核(反審核)
  const isAudit = form.audit === null || form.audit === "";
  const params = {
    danno: form.danno,
    table: "cldhdmst",
    formno: "cldhd",
  };

  await utils.auditOrder(isAudit, params); // 切換資料庫中的審核狀態
  await initializeData(); // 重新加載資料

  await checkButtonFlags(); // 審核狀態改變後，重新檢查按鈕狀態
};

const exportExcel = () => {
  // 導出 Excel 檔案

  // 將資料轉換為適合導出的格式
  const dataToExport = results.value.map((row) => {
    let rowNew = {};
    headers.value.forEach((header) => {
      if (header.title !== "") {
        rowNew[header.title] = row[header.key]; // 根據 key 取值並用 title 作為新鍵名
      }
    });
    return rowNew;
  });

  // 建立工作簿和工作表
  const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
    skipHeader: false,
  });

  // 手動添加標題列
  const headerTitles = headers.value.map((header) => header.title);
  XLSX.utils.sheet_add_aoa(worksheet, [headerTitles], { origin: "A1" });

  // 建立工作簿並附加工作表
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "收貨單明細");

  // 導出文件
  XLSX.writeFile(workbook, "收貨單明細.xlsx");
};

// 檢查按鈕是否禁用
const {
  isAddDisabled,
  isEditDisabled,
  isDeleteOrderDisabled,
  isToggleAuditDisabled,
  isExportExcelDisabled,
  checkButtonFlags,
} = useCheckButtonFlags("cldhd", form.audit);

const isReadonly = (inputType, isEditable, componentType) => {
  //是否唯讀
  return (
    mode.value === "view" ||
    (mode.value === "add" &&
      inputType !== "inputable" &&
      !(inputType === "optional" && componentType === "select")) ||
    (mode.value === "edit" && !isEditable)
  );
};

// 上方的欄位
const formRows = computed(() => {
  const formRowsTemp = [
    [
      // 供方編碼
      labels.value["label.cldhdmst.supplyno"],
      // 按鈕需要在這裡自己定義
      // ...按鈕
      {
        column: "supplyBtn",
        componentType: "button",
        isAllowBlank: true,
        cols: "1",
        onClick: openDialog,
        disabled: () => mode.value !== "add" || isOtherFieldDisabled.value,
        name: "...",
      },
      labels.value["label.cldhdmst.danno"],
    ],
    [
      labels.value["label.supply.supplyname"],
      labels.value["label.cldhdmst.ddate"],
    ],
    [
      labels.value["label.cldhdmst.demo"],
      labels.value["label.cldhdmst.maker"],
      labels.value["label.cldhdmst.audit"],
    ],
  ];
  return formRowsTemp;
});
console.log("formRows:", formRows.value);
/*
const isMstComplete = computed(() => {
  // 以後其他頁面可能也會用到, 到時候應該可以移到utils裡面
  // 檢查mst的欄位是否有空值
  for (let row of formRows.value) {
    for (let field of row) {
      if (
        !field.isAllowBlank &&
        (form[field.column] === null || form[field.column] === "")
      ) {
        return false; // 有空值，返回false
      }
    }
  }
  return true; // 所有欄位都有值，返回true
});
*/
const limitPercentage = ref(0); // 收貨數量的限制百分比

// --- Lifecycle Hooks ---
onMounted(async () => {
  // 原本的created, 應該可以拿出來直接執行?

  spkindnoOptions.value = await utils.fetchCategories(); // 取得收貨類別選項
  console.log("spkindnoOptions:", spkindnoOptions.value);
  paynoOptions.value = await utils.fetchData("pay.php", {}); // 取得幣別選項

  // 取得限制百分比
  // view mode 時不需要
  const limitPercentageData = await utils.fetchData(
    "getLimitPercentage.php",
    {}
  );
  limitPercentage.value = limitPercentageData[0];
  console.log("限制百分比：", limitPercentage.value);

  // 檢查 URL 參數，如果 mode === 'edit' ，自動切換到編輯模式
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("mode") === "add") {
    await setMode("add");
    // 移除 URL 中的 mode 參數
    const urlCurrent = new URL(window.location);
    urlCurrent.searchParams.delete("mode");
    window.history.replaceState({}, "", urlCurrent);
  } else if (urlParams.get("mode") === "edit") {
    await setMode("edit");
    // 移除 URL 中的 mode 參數
    const urlCurrent = new URL(window.location);
    urlCurrent.searchParams.delete("mode");
    window.history.replaceState({}, "", urlCurrent);
  } else {
    console.log("模式:", mode.value);
    await setMode("view");
  }
});
</script>

<style src="@/assets/vCustom.css" scoped></style>
