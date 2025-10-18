import React, { useEffect, useRef } from 'react';
import 'select2icon/dist/select2icon.min.css';
import { fontAwesomeIcons } from 'select2icon/icons';

export default function Select2Icon({ icons, language, selected, onChange }) {
    const inputRef = useRef(null);
    const instanceRef = useRef(null);

    useEffect(() => {
        instanceRef.current = new select2icon({
            target: inputRef.current,
            icons: fontAwesomeIcons,
            language,
            selected,
            onSelected: (key) => onChange?.(key)
        });
    }, [icons, language, selected]);

    return <input ref={inputRef} placeholder="Select an icon..." />;
}