import {
    System
} from "./types";

declare global {
    let automatedPolymorpherSystemInterface: 'automatedPolymorpherSystemInterface' extends keyof false ? System : System;
}