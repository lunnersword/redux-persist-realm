import td from "testdouble";

export default {
    open : td.func("open"),
    objectForPrimaryKey: td.func("objectForPrimaryKey"),
    create: td.func("create"),
    write: td.func("write"),
    delete: td.func("delete"),
    close: td.func("close")
};