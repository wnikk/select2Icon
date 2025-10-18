<template>
    <input ref="inputRef" :placeholder="placeholder" />
</template>

<script>
import 'select2icon/dist/select2icon.css';
import select2icon from 'select2icon';
import { fontAwesomeIcons } from 'select2icon/icons';

export default {
    name: 'Select2Icon',
    props: {
        icons: Array,
        placeholder: String,
        language: String,
        selected: String
    },
    mounted() {
        this.instance = new select2icon({
            target: this.$refs.inputRef,
            icons: this.icons || fontAwesomeIcons,
            language: this.language,
            selected: this.selected,
            onSelected: (key) => this.$emit('update:selected', key)
        });
    },
    methods: {
        setIcon(key) {
            this.instance?.setIcon(key);
        },
        getIcon() {
            return this.instance?.getIcon();
        }
    }
};
</script>