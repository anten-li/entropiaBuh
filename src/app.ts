namespace LAO_Lib {
    /**
     * Элемент меню LAO_TabMenu
     * */
    export type LAO_TMenuItem = { Name: string, Tab: LAO_Form | undefined, LiElement: HTMLElementTagNameMap['li'] }
    /**
     * возможные значение у атрибута Type тега Input
     * */
    export type InputType = 'button' | 'checkbox' | 'file' | 'hidden' | 'image' | 'password' | 'radio' | 'reset' | 'submit' | 'text'

    export interface FormParameter {
        title?: boolean
    }
    export interface SubmitEvent extends Event {
        readonly submitter: HTMLInputElement
    }

    export class LAO_Element<T extends keyof HTMLElementTagNameMap> {
        public Element: HTMLElementTagNameMap[T];
        constructor(Name: T, Parent?: HTMLElement) {
            this.Element = document.createElement(Name)
            if (Parent) this.Parent = Parent
            //this.Element.onresize = this.onResize
        }
        public Hide(): void {
            this.Element.style.display = 'none'
        }
        public Show(): void {
            this.Element.style.display = ''
        }
        set Parent(Parent: HTMLElement | null) {
            if (!this.Element.parentElement && Parent) {
                Parent.appendChild(this.Element)
            }
        }
        get Parent(): HTMLElement | null { return this.Element.parentElement }
        public Delete() {
            if (this.Element.parentElement) this.Element.parentElement.removeChild(this.Element)
        }
        //public onResize(ev?: UIEvent) { }
    }
    export class LAO_Form extends LAO_Element<'div'> {
        private Title_: HTMLElementTagNameMap['h1'] | undefined
        constructor(Parent?: HTMLElement, Parameter?: FormParameter) {
            super('div', Parent)
            if (!Parameter || Parameter.title) {
                const FormTitle = document.createElement('div')
                FormTitle.classList.add('FormTitle')
                this.Title_ = document.createElement('h1')
                const XElem = document.createElement('div')
                XElem.onclick = this.onClose
                FormTitle.appendChild(XElem).innerHTML = 'X'
                FormTitle.appendChild(this.Title_)
                this.Element.appendChild(FormTitle)
            }
        }
        set Title(text: string) {
            if (this.Title_) this.Title_.innerHTML = text
        }
        get Title(): string {
            return this.Title_ ? this.Title_.innerHTML : ''
        }
        @CallBack
        public onClose(ev?: Event) {
            this.Delete()
        }
    }
    export class LAO_TabMenu extends LAO_Element<'nav'> {
        public Tabs: LAO_TMenuItem[] = []
        public MenuList: HTMLElementTagNameMap['ul']
        public CurrentTab: LAO_TMenuItem | undefined
        constructor(public Parent: HTMLElement, param?: { ForceElement: HTMLDivElement }) {
            super('nav', Parent)
            this.MenuList = this.Element.appendChild(document.createElement('ul'))
        }
        private onClick_(elm: LAO_TMenuItem, ev?: MouseEvent): void {
            if (this.onClick && !this.onClick(elm, ev)) return
            if (this.CurrentTab && this.CurrentTab.Tab) this.CurrentTab.Tab.Hide()
            this.CurrentTab?.LiElement.classList.remove('active')
            this.CurrentTab = elm
            this.CurrentTab?.LiElement.classList.add('active')
            if (elm.Tab) elm.Tab.Show()
        }
        public onClick: undefined | ((elm: LAO_TMenuItem, ev?: MouseEvent) => boolean)
        public Add<NameType extends string>(Name: NameType, nForm?: LAO_Form): LAO_TMenuItem {
            const nElement: LAO_TMenuItem = { Name, Tab: nForm, LiElement: document.createElement('li') }
            this.Tabs.push(nElement)
            if (nElement.Tab && !nElement.Tab.Parent) {
                nElement.Tab.Parent = this.Parent
                nElement.Tab.Hide()
            }
            this.MenuList.appendChild(nElement.LiElement)
            nElement.LiElement.innerHTML = Name
            nElement.LiElement.onclick = (ev: MouseEvent) => this.onClick_(nElement, ev)
            return nElement
        }
        public DeleteItem(nForm: LAO_Form) {
            for (let i = 0; i < this.Tabs.length; i++) {
                if (this.Tabs[i].Tab === nForm) {
                    this.MenuList.removeChild(this.Tabs[i].LiElement)
                    this.Tabs.splice(i, 1)
                    break
                }
            }
        }
        public ChangeTab(Name: string) {
            for (let i = 0; i < this.Tabs.length; i++)
                if (this.Tabs[i].Name == Name) this.onClick_(this.Tabs[i])
        }
        public Tab(Name: string) {
            for (let i = 0; i < this.Tabs.length; i++)
                if (Name === this.Tabs[i].Name) return this.Tabs[i]
            return null
        }
    }
    export class LAO_Dropdown<T extends keyof HTMLElementTagNameMap> extends LAO_Element<'div'> {
        public CurrentElement: HTMLElementTagNameMap[T]
        private Menu: HTMLElementTagNameMap['ul']
        constructor(ValueElement: HTMLElementTagNameMap[T], Parent?: HTMLElement, param?: { Values?: readonly string[] }) {
            super('div', Parent)
            this.CurrentElement = this.Element.appendChild(ValueElement)
            if (this.CurrentElement.tagName.toLowerCase() === 'input') (this.CurrentElement as HTMLInputElement).disabled = true
            this.Menu = this.Element.appendChild(document.createElement('ul'))
            this.Element.onmousemove = (ev: MouseEvent) => {
                if (this.Menu.style.display = 'none') this.Menu.style.display = ''
            }
            if (param?.Values)
                for (let i = 0; i < param.Values.length; i++) {
                    this.Add(param.Values[i])
                }
            this.Rezize()
        }
        public Add(Name: string) {
            const li = this.Menu.appendChild(document.createElement('li'))
            li.innerHTML = Name
            li.onclick = (ev: MouseEvent) => { this._onClick(li, ev) }
        }
        public Rezize() {
            this.Menu.style.display = 'inline-block'
            this.CurrentElement.style.width = this.Menu.getBoundingClientRect().width + 'px'
            this.Menu.style.display = ''
        }
        @CallBack
        public _onClick(elm: HTMLElementTagNameMap['li'], ev?: MouseEvent) {
            if (this.CurrentElement.tagName.toLowerCase() === 'input') (this.CurrentElement as HTMLInputElement).value = elm.innerHTML
            else this.CurrentElement.innerHTML = elm.innerHTML
            this.Menu.style.display = 'none'
            this.onClick(elm, ev)
        }
        public onClick(elm: HTMLElementTagNameMap['li'], ev?: MouseEvent) { }
        public Item(Name: string) {
            for (let i = 0; i < this.Menu.childElementCount; i++)
                if (this.Menu.children[i].innerHTML === Name) return this.Menu.children[i] as HTMLElementTagNameMap['li']
            return null
        }
    }
    export type TableColumn = {
        Name: string
        Hidden: boolean
        ClassCol?: boolean
    }
    export class Table extends LAO_Element<'table'> {
        constructor(Parent?: HTMLElement, public Column?: Record<string, TableColumn>) {
            super('table', Parent)
            this.Element.createTHead()
            this.Element.createTBody()
            if (Column) this.SetColumn(Column)
            window.addEventListener('resize', this.Resize)
        }
        public SetColumn(Col: Record<string, TableColumn>) {
            const tHead = this.Element.tHead
            if (tHead) {
                this.Column = Col
                tHead.innerHTML = ''
                const tRow = tHead.insertRow()
                for (const key in Col) {
                    if (Col[key].ClassCol) continue
                    const cc = tRow.insertCell()
                    cc.innerHTML = Col[key].Name
                    if (Col[key].Hidden) cc.style.display = 'none'
                }
            }
        }
        public SetData(Data: Record<string, string>[]) {
            if (this.Element.tBodies.length === 1) {
                const tBody = this.Element.tBodies[0]
                tBody.innerHTML = ''
                for (let i = 0; i < Data.length; i++) {
                    const tRow = tBody.insertRow()
                    for (const key in this.Column) {
                        if (this.Column[key].ClassCol) {
                            tRow.classList.add(Data[i][key])
                            continue
                        }
                        const cc = tRow.insertCell()
                        cc.innerHTML = Data[i][key];
                        if (this.Column[key].Hidden) cc.style.display = 'none'
                    }
                }
            }
            this.Resize()
        }
        @CallBack
        public Resize() {
            const Parent = this.Element.parentElement

            if (Parent && this.Element.tBodies.length === 1 && this.Element.tHead) {
                const tBody = this.Element.tBodies[0]
                tBody.style.maxHeight = Parent.getBoundingClientRect().height
                    - (tBody.getBoundingClientRect().top - Parent.getBoundingClientRect().top)

                    - parseInt(getComputedStyle(Parent).borderBottomWidth)
                    - parseInt(getComputedStyle(this.Element).marginBottom) + 'px'

                setInterval((tB: HTMLTableSectionElement, tH: HTMLTableSectionElement) => {
                    if (tB.rows.length > 0 && tH.rows.length > 0)
                        for (let i = 0; i < tH.rows[0].cells.length; i++)
                            tH.rows[0].cells[i].style.width =
                                getComputedStyle(tB.rows[0].cells[i]).width
                    if (tB.clientHeight == tB.scrollHeight)
                        tB.parentElement?.classList.remove('TabScr')
                    else
                        tB.parentElement?.classList.add('TabScr')
                }, 10, tBody, this.Element.tHead)
            }
        }
    }
    export function CreateText<T extends keyof HTMLElementTagNameMap>(Name: T, Text: string, Class?: string): HTMLElementTagNameMap[T] {
        let elm = document.createElement(Name)
        elm.innerHTML = Text
        if (Class) elm.classList.add(Class)
        return elm
    }
    export function CreateBlock(elm: HTMLElement[]) {
        const Result = document.createElement('div')
        for (let i = 0; i < elm.length; i++)
            Result.appendChild(elm[i])
        return Result
    }
    export function CteateInput(Type: InputType, Name: string, Value?: string,
        OnClick?: ((ev: MouseEvent) => any)) {

        const elm = document.createElement('input')
        elm.name = Name
        elm.type = Type
        if (Value) elm.value = Value
        if (OnClick) elm.onclick = OnClick
        return elm
    }
    export function CallBack<T extends Function>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T> {
        return {
            configurable: true,
            enumerable: false,
            get() {
                return descriptor.value?.bind(this)
            }
        }
    }
}
namespace Entropia {
    /**возможные типы номенклатуры
     * */
    const ItemType = [
        "финансы", "Одежда", "броня", "Оружие", "Инструмент", "Материал",
        "ресурс", "Чертеж", "прочие", "Майндфорс"
    ] as const
    //type ItemTypeValues = typeof ItemType[number]

    /**возможные названия форм
     * */
    type FooterFormNames = 'Cписок номенклатуры' | 'Настройки' | 'Новый элемент' | 'Журнал'

    interface srvResp<T extends object | string> {
        noErr: boolean
        rez: T
    }
    interface srvLogin {
        logined: boolean
        access_token: string
    }
    interface srvRequType {
        otch: { tabType: string, depth: string }
    }
    /**типы запросов на сервер, srvRequ<'otch'>
     * */
    type srvRequ<T extends keyof srvRequType> = { cmd: T } & srvRequType[T]

    export var MainForm: EntropiaMainForm | undefined
    export var FormFooter: LAO_Lib.LAO_TabMenu
    class EntropiaLoginForm extends LAO_Lib.LAO_Form {
        public Form: HTMLElementTagNameMap['form'] & Partial<Record<'User' | 'Password', HTMLInputElement>>
        constructor(Parent: HTMLElement) {
            super(Parent, { title: false });
            this.Form = document.createElement('form')
            this.Element.appendChild(this.Form)
            this.Form.appendChild(LAO_Lib.CreateText('label', 'пользователь:'))
            this.Form.appendChild(LAO_Lib.CteateInput('text', 'User'))
            this.Form.appendChild(LAO_Lib.CreateText('label', 'пароль:'))
            this.Form.appendChild(LAO_Lib.CteateInput('password', 'Password'))
            this.Form.appendChild(LAO_Lib.CreateBlock([LAO_Lib.CteateInput('submit', 'Submit', 'Вход')])).classList.add('SubmitFooter')
            this.Form.onsubmit = this.onLogin

            this.Element.classList.add('LoginForm')
        }
        @LAO_Lib.CallBack
        public onLogin(ev: Event) {
            new ServerCall(this.onLoginNext, undefined, {
                headers: {
                    Authorization: 'Basic ' + btoa(encodeURIComponent(`${this.Form.User?.value}:${this.Form.Password?.value}`)
                        .replace(/%([0-9A-Za-z]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))))
                }
            })

            return false
        }
        @LAO_Lib.CallBack
        public onLoginNext(rez: srvLogin) {
            if (rez.logined) {
                this.Delete()
                MainForm = new EntropiaMainForm(rez.access_token)
            }
        }
        public Delete() {
            super.Delete()
            this.Form.onsubmit = null
        }
    }
    class EntropiaMainForm extends LAO_Lib.LAO_Form {
        public Menu: LAO_Lib.LAO_TabMenu
        constructor(public token: string) {
            super(document.body, { title: false })

            this.Menu = new LAO_Lib.LAO_TabMenu(this.Element)
            this.Menu.Add('Журнал')
            this.Menu.Add('Номенклатера')
            this.Menu.Add('Настройки')
            this.Menu.Add('Выход')
            this.Menu.onClick = this.MenuClick

            FormFooter = new LAO_Lib.LAO_TabMenu(document.body)

            this.Element.classList.add('MainForm')
            this.Menu.Element.classList.add('SideMenu')
            FormFooter.Element.classList.add('FormFooter')
        }
        public Delete() {
            super.Delete()
            FormFooter.Delete()
            this.Menu.onClick = undefined
            MainForm = undefined
        }
        @LAO_Lib.CallBack
        public MenuClick(tab: LAO_Lib.LAO_TMenuItem) {
            if (tab.Name === 'Выход') {
                this.Delete()
                new EntropiaLoginForm(document.body)
            } else if (tab.Name === 'Номенклатера') {
                this.CreateSubForm('Cписок номенклатуры', ItemListForm)
            } else if (tab.Name === 'Настройки') {
                this.CreateSubForm('Настройки', SettingForm)
            } else if (tab.Name === 'Журнал') {
                this.CreateSubForm('Журнал', ReportForm)
            }
            return false
        }
        private CreateSubForm<T extends new (...args: any) => any>(Name: FooterFormNames, Form: T) {
            const sp = this.FindForm(Name)
            if (!sp) new Form(this.Element)
            else sp.LiElement.click()
        }
        public FindForm(Name: string): LAO_Lib.LAO_TMenuItem | undefined {
            for (let i = 0; i < FormFooter.Tabs.length; i++) if (FormFooter.Tabs[i].Name === Name) return FormFooter.Tabs[i]
        }
    }
    class ReportForm extends LAO_Lib.LAO_Form {
        private ElementForm: HTMLFormElement & Partial<Record<'RType' | 'RDepth', HTMLInputElement>>
        public ReportTable: LAO_Lib.Table
        constructor(Parent: HTMLElement) {
            super(Parent);
            this.Title = 'Журнал'
            this.ElementForm = document.createElement('form')
            this.Element.appendChild(this.ElementForm)
            const menu = this.ElementForm.appendChild(this.Element.appendChild(document.createElement('nav')))

            let EDropdown = SetUpDropdown(new LAO_Lib.LAO_Dropdown<'input'>(LAO_Lib.CteateInput('text', 'RType'), menu, {
                Values: ['Номенклатура', 'Документы']
            }), this.UpDateReport)
            EDropdown.CurrentElement.value = 'Номенклатура'

            EDropdown = SetUpDropdown(new LAO_Lib.LAO_Dropdown<'input'>(LAO_Lib.CteateInput('text', 'RDepth'), menu, {
                Values: ['1', '2', '3']
            }), this.UpDateReport)
            EDropdown.CurrentElement.value = '1'

            this.ReportTable = new LAO_Lib.Table(this.Element, {
                Name: { Name: "Наименование", Hidden: false },
                Value: { Name: "Сумма", Hidden: false },
                lvl: { Name: "Class", Hidden: true, ClassCol: true }
            })

            this.UpDateReport()

            FormFooter.Add<FooterFormNames>('Журнал', this).LiElement.click()

            this.Element.classList.add('SubForm')
            this.ElementForm.classList.add('ElementForm')
            this.ReportTable.Element.classList.add('TableValue')
        }
        public Delete() {
            super.Delete()
            FormFooter.DeleteItem(this)
        }
        @LAO_Lib.CallBack
        public UpDateReport(elm?: HTMLElementTagNameMap['li'], ev?: MouseEvent) {
            if (this.ElementForm.RType && this.ElementForm.RDepth)
                new ServerCall(this.UpDateReportNext, {
                    cmd: 'otch',
                    tabType: this.ElementForm.RType.value,
                    depth: this.ElementForm.RDepth.value
                })
        }
        @LAO_Lib.CallBack
        public UpDateReportNext(rez: object) {
            this.ReportTable.SetData(rez as Record<string, string>[])
        }
    }
    class ItemListForm extends LAO_Lib.LAO_Form {
        Menu: LAO_Lib.LAO_TabMenu
        constructor(Parent: HTMLElement) {
            super(Parent);
            this.Title = 'Список номенклатуры'
            this.Menu = new LAO_Lib.LAO_TabMenu(this.Element)
            this.Menu.Add('+')
            this.Menu.Add('&#128465')
            this.Menu.Add('&#8634')
            this.Menu.onClick = this.MenuClick

            FormFooter.Add<FooterFormNames>('Cписок номенклатуры', this).LiElement.click()

            this.Element.classList.add('SubForm')
            this.Menu.Element.classList.add('LineMenu')
        }
        public Delete() {
            super.Delete()
            FormFooter.DeleteItem(this)
        }
        @LAO_Lib.CallBack
        public MenuClick(tab: LAO_Lib.LAO_TMenuItem) {
            if (tab.Name === '+') {
                if (MainForm) new ItemForm(MainForm.Element)
            }
            return false
        }
    }
    class SettingForm extends LAO_Lib.LAO_Form {
        private FileStartLoad: HTMLInputElement
        constructor(Parent: HTMLElement) {
            super(Parent)
            this.FileStartLoad = LAO_Lib.CteateInput('file', 'FileName')
            this.FileStartLoad.setAttribute('accept', '.csv')
            this.FileStartLoad.onchange = this.StartLoad
            this.Element.appendChild(LAO_Lib.CreateText('label', 'загрузить остатки', 'Button'))
                .appendChild(this.FileStartLoad).style.display = 'none'
            this.Title = 'Настройки'

            FormFooter.Add<FooterFormNames>('Настройки', this).LiElement.click()

            this.Element.classList.add('SubForm')
        }
        @LAO_Lib.CallBack
        public StartLoad(ev: Event) {
            if (this.FileStartLoad.files?.length === 1) {
                const reader = new FileReader()
                reader.readAsText(this.FileStartLoad.files[0]);
                reader.onload = this.StartLoadSend
            }
        }
        @LAO_Lib.CallBack
        public StartLoadSend(ev: ProgressEvent<FileReader>) {
            if (typeof ev.target?.result === "string") {
                const rez = ev.target.result.split(String.fromCharCode(10));
                const rez2: string[][] = []
                for (let i = 0; i < rez.length; i++) rez2[i] = rez[i].split(";");

                //server call
            }
        }
    }
    class ItemForm extends LAO_Lib.LAO_Form {
        private ElementForm: HTMLFormElement & Partial<Record<'ItemName' | 'ItemType' | 'ItemValue' | 'ItemDecay', HTMLInputElement>>
        constructor(Parent: HTMLElement) {
            super(Parent)
            this.Title = 'Новый элемент, номенклатура'
            this.ElementForm = document.createElement('form')
            this.Element.appendChild(this.ElementForm)
            this.ElementForm.appendChild(LAO_Lib.CreateBlock([
                LAO_Lib.CreateText('label', 'Наименование:'),
                LAO_Lib.CteateInput('text', 'ItemName')]))
            const TypeDropdown = SetUpDropdown(new LAO_Lib.LAO_Dropdown<'input'>(LAO_Lib.CteateInput('text', 'ItemType'), this.ElementForm, {
                Values: ItemType
            }), this.onTypeSelect)
            TypeDropdown.CurrentElement.value = '<...>'
            this.ElementForm.appendChild(LAO_Lib.CreateBlock([
                LAO_Lib.CreateText('label', 'Тип:'),
                TypeDropdown.Element]))
            this.ElementForm.appendChild(LAO_Lib.CreateBlock([
                LAO_Lib.CreateText('label', 'Стоимость:'),
                LAO_Lib.CteateInput('text', 'ItemValue')]))
            this.ElementForm.appendChild(LAO_Lib.CreateBlock([
                LAO_Lib.CreateText('label', 'Износ:'),
                LAO_Lib.CteateInput('text', 'ItemDecay')]))
            this.ElementForm.appendChild(LAO_Lib.CreateBlock([
                LAO_Lib.CteateInput('submit', 'Ok', 'Ок', this.Save),
                LAO_Lib.CteateInput('submit', 'Cancel', 'Отмена', () => { this.onClose() })])).classList.add('SubmitFooter')
            this.ElementForm.onsubmit = () => false

            FormFooter.Add<FooterFormNames>('Новый элемент', this).LiElement.click()

            if (this.ElementForm.ItemDecay) this.ElementForm.ItemDecay.disabled = true

            this.Element.classList.add('SubForm')
            this.ElementForm.classList.add('ElementForm')
        }
        @LAO_Lib.CallBack
        public onTypeSelect(elm: HTMLElementTagNameMap['li'], ev?: MouseEvent) {
            if (this.ElementForm.ItemDecay)
                if (elm.innerHTML === ItemType[3] ||
                    elm.innerHTML === ItemType[4]) this.ElementForm.ItemDecay.disabled = false
                else {
                    this.ElementForm.ItemDecay.disabled = true
                    this.ElementForm.ItemDecay.value = ''
                }
        }
        @LAO_Lib.CallBack
        public Save() {
            //server call

            this.onClose()
        }
        public Delete() {
            super.Delete()
            FormFooter.DeleteItem(this)
            const lastElemen = FormFooter.MenuList.lastElementChild as HTMLElement
            if (lastElemen) lastElemen.click()
        }
    }
    class ServerCall<T extends object | string, R extends keyof srvRequType> {
        constructor(private CallBackFunc: (rez: T) => any, srvRequ?: srvRequ<R>, param?: RequestInit) {
            if (!param) param = {}
            if (!param.method) param.method = 'POST'
            if (srvRequ) {
                param.body = JSON.stringify(srvRequ)
                param.headers = {
                    Authorization: 'Bearer ' + MainForm?.token,
                    'Content-Type': 'application/json'
                }
            }
            try {
                fetch('index.php', param).then(this.onResponse).then(this.onResponseNext)
            } catch (e) {
                alert('fetch не поддерживается')
            }
        }
        @LAO_Lib.CallBack
        public onResponse(rez: Response) {
            if (rez.ok) return rez.json()
            else alert(rez.statusText)
        }
        @LAO_Lib.CallBack
        public onResponseNext(rez?: srvResp<T>) {
            if (rez?.noErr) this.CallBackFunc(rez.rez)
            else if (rez?.rez === 'Authentication failure') {
                alert('Ошибка авторизации')
                if (MainForm) MainForm.Menu.ChangeTab('Выход')
            }
            else alert(rez?.rez)
        }
    }
    export function EntropiaInit(ev: Event): any {
        new EntropiaLoginForm(document.body)
    }
    function SetUpDropdown<T extends keyof HTMLElementTagNameMap>(elm: LAO_Lib.LAO_Dropdown<T>,
        ff?: (elm: HTMLElementTagNameMap['li'], ev?: MouseEvent) => any) {

        if (ff) elm.onClick = ff
        elm.Element.classList.add('LAO_Dropdown')
        elm.CurrentElement.classList.add('LAO-Dropdown-element')
        elm.Rezize()

        return elm
    }
}
window.onload = Entropia.EntropiaInit
//window.onresize = function () { alert(11) }
//window.addEventListener('onresize', () => { alert(11)})